import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Sheet } from '@/ui/Sheet';
import { Field } from '@/ui/Field';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { Money } from '@/ui/Money';
import { guardarHandoff } from '@/lib/handoff';
import { crearLead, ApiError } from '@/lib/api';
import {
  DATOS_ALTA_VACIOS,
  hayErrores,
  validarAlta,
  validarEmail,
  type DatosAlta,
  type ErroresAlta,
} from '@/features/alta/validacion';

export interface ItemAlta {
  tipo: 'plan' | 'producto';
  id: string;
  nombre: string;
  precio: number;
  pendiente?: boolean;
}

export interface AltaDialogProps {
  abierto: boolean;
  onCambio: (abierto: boolean) => void;
  item: ItemAlta;
}

type Modo = 'alta' | 'login';

// Orden visual de los campos (de arriba hacia abajo): decide a cuál volver el
// foco cuando el envío falla con más de un error a la vez.
const ORDEN_CAMPOS: Array<keyof DatosAlta> = ['nombre', 'apellido', 'email', 'dni'];

function idDelCampo(campo: keyof DatosAlta): string {
  return `alta-${campo}`;
}

function enfocarCampo(id: string) {
  document.getElementById(id)?.focus();
}

/**
 * Popup de creación del usuario base. El plan o producto elegido NO es un campo
 * que el usuario complete: viaja oculto, tal como pidió el flujo de Federico.
 */
export function AltaDialog({ abierto, onCambio, item }: AltaDialogProps) {
  const navegar = useNavigate();
  const [modo, setModo] = useState<Modo>('alta');
  const [datos, setDatos] = useState<DatosAlta>(DATOS_ALTA_VACIOS);
  const [errores, setErrores] = useState<ErroresAlta>({});
  // `enviando` deshabilita el submit mientras el request a /api/leads está en
  // vuelo (evita doble click → doble lead). `errorEnvio` muestra un mensaje
  // general cuando el backend devuelve error no atribuible a un campo.
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  // Al reabrir el popup arranca siempre en modo alta, sin datos ni errores de
  // un intento anterior: si alguien cerró estando en modo login, o cerró
  // después de un submit fallido, la próxima apertura no hereda ese estado.
  useEffect(() => {
    if (!abierto) return;
    setModo('alta');
    setDatos(DATOS_ALTA_VACIOS);
    setErrores({});
    setErrorEnvio(null);
    setEnviando(false);
  }, [abierto]);

  // Radix enfoca por defecto el primer elemento tabulable del diálogo, que es
  // el botón "Cerrar": quien abre el popup para contratar quiere escribir su
  // nombre, no cerrarlo. El propio autofoco de Radix también se resuelve en el
  // siguiente frame, así que hay que esperar un `requestAnimationFrame` más
  // para que nuestro foco gane la carrera y no lo pise el de Radix.
  useEffect(() => {
    if (!abierto) return;
    const marco = requestAnimationFrame(() => {
      enfocarCampo(modo === 'alta' ? idDelCampo('nombre') : idDelCampo('email'));
    });
    return () => cancelAnimationFrame(marco);
  }, [abierto, modo]);

  function cambiarModo(nuevo: Modo) {
    setModo(nuevo);
    setErrores({});
  }

  function actualizar(campo: keyof DatosAlta, valor: string) {
    setDatos((previos) => ({ ...previos, [campo]: valor }));
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;

    if (modo === 'login') {
      const errorEmail = validarEmail(datos.email);
      if (errorEmail !== undefined) {
        setErrores({ email: errorEmail });
        enfocarCampo(idDelCampo('email'));
        return;
      }
      guardarHandoff({ intent: 'login', email: datos.email.trim() });
      void navegar('/revisa-tu-mail');
      return;
    }

    const encontrados = validarAlta(datos);
    if (hayErrores(encontrados)) {
      setErrores(encontrados);
      const primerCampoConError = ORDEN_CAMPOS.find((campo) => encontrados[campo] !== undefined);
      if (primerCampoConError) enfocarCampo(idDelCampo(primerCampoConError));
      return;
    }

    const usuario = {
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      email: datos.email.trim(),
      dni: datos.dni.trim(),
    };

    setEnviando(true);
    setErrorEnvio(null);

    try {
      await crearLead({
        tipo: item.tipo,
        itemId: item.id,
        itemNombre: item.nombre,
        ...usuario,
      });

      // El handoff queda en sessionStorage sólo para que `/revisa-tu-mail`
      // pueda mostrar el email al que se mandó el link, sin tener que
      // volver a pedirlo con otro fetch. El lead real ya vive en la DB.
      guardarHandoff({
        intent: 'alta',
        tipo: item.tipo,
        id: item.id,
        usuario,
      });
      void navegar('/revisa-tu-mail');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.cuerpo.error === 'payload_invalido' && err.cuerpo.detalles) {
          // El server rechazó algún campo específico (ej. DNI mal formateado)
          // → lo mostramos sobre el input correspondiente.
          const porCampo: ErroresAlta = {};
          for (const [campo, mensajes] of Object.entries(err.cuerpo.detalles)) {
            const primero = mensajes?.[0];
            if (primero && campo in DATOS_ALTA_VACIOS) {
              porCampo[campo as keyof DatosAlta] = primero;
            }
          }
          if (Object.keys(porCampo).length > 0) {
            setErrores(porCampo);
            const primerCampoConError = ORDEN_CAMPOS.find((campo) => porCampo[campo] !== undefined);
            if (primerCampoConError) enfocarCampo(idDelCampo(primerCampoConError));
            setErrorEnvio(null);
          } else {
            setErrorEnvio('Revisá los datos e intentá de nuevo.');
          }
        } else if (err.cuerpo.error === 'email_send_error') {
          setErrorEnvio('No pudimos enviarte el email ahora. Intentá en unos minutos.');
        } else {
          setErrorEnvio('Algo falló en el servidor. Intentá de nuevo.');
        }
      } else {
        setErrorEnvio('No pudimos conectar con el servidor. Revisá tu conexión.');
      }
    } finally {
      setEnviando(false);
    }
  }

  const campoEmail = (
    <Field label="Email" htmlFor={idDelCampo('email')} error={errores.email} requerido>
      <Input
        id={idDelCampo('email')}
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={datos.email}
        onChange={(evento) => actualizar('email', evento.target.value)}
      />
    </Field>
  );

  return (
    <Sheet abierto={abierto} onCambio={onCambio} titulo={`Contratar ${item.nombre}`}>
      {/* Resumen visible de lo que se contrata: el usuario tiene que ver qué
          está por pagar sin volver atrás. */}
      <div className="mb-5 rounded-campo bg-ink-50 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-ink-800">{item.nombre}</span>
          <Money monto={item.precio} periodo="por mes" />
        </div>
      </div>

      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        <input type="hidden" name="itemTipo" value={item.tipo} />
        <input type="hidden" name="itemId" value={item.id} />

        {modo === 'alta' ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre" htmlFor={idDelCampo('nombre')} error={errores.nombre} requerido>
                <Input
                  id={idDelCampo('nombre')}
                  name="nombre"
                  autoComplete="given-name"
                  value={datos.nombre}
                  onChange={(evento) => actualizar('nombre', evento.target.value)}
                />
              </Field>
              <Field label="Apellido" htmlFor={idDelCampo('apellido')} error={errores.apellido} requerido>
                <Input
                  id={idDelCampo('apellido')}
                  name="apellido"
                  autoComplete="family-name"
                  value={datos.apellido}
                  onChange={(evento) => actualizar('apellido', evento.target.value)}
                />
              </Field>
            </div>

            {campoEmail}

            {/* DNI: SF lo usa como clave de reconocimiento del Prospecto
                (documentType=DNI + documentNumber). Sin esto el envío a
                /leads rebota 400. El resto de datos personales (teléfono,
                fecha de nacimiento, domicilio) se completa después en el
                portal para el enrich. */}
            <Field label="DNI" htmlFor={idDelCampo('dni')} error={errores.dni} requerido>
              <Input
                id={idDelCampo('dni')}
                name="dni"
                type="text"
                inputMode="numeric"
                maxLength={8}
                autoComplete="off"
                value={datos.dni}
                onChange={(evento) => actualizar('dni', evento.target.value.replace(/\D/g, ''))}
              />
            </Field>
          </>
        ) : (
          campoEmail
        )}

        {errorEnvio ? (
          <div
            role="alert"
            className="rounded-campo border border-danger-500/30 bg-danger-50 px-4 py-3 text-sm text-danger-700"
          >
            {errorEnvio}
          </div>
        ) : null}

        <Button type="submit" ancho="full" tamano="lg" disabled={enviando}>
          {enviando ? 'Enviando…' : modo === 'alta' ? 'Crear cuenta' : 'Enviarme el enlace'}
        </Button>

        <p className="text-center text-sm text-ink-600">
          {modo === 'alta' ? (
            <>
              ¿Ya sos socio?{' '}
              <button
                type="button"
                onClick={() => cambiarModo('login')}
                className="font-medium text-marca-600 underline underline-offset-2 hover:text-marca-700"
              >
                Ya tengo cuenta
              </button>
            </>
          ) : (
            <>
              ¿Primera vez?{' '}
              <button
                type="button"
                onClick={() => cambiarModo('alta')}
                className="font-medium text-marca-600 underline underline-offset-2 hover:text-marca-700"
              >
                Crear una cuenta
              </button>
            </>
          )}
        </p>
      </form>
    </Sheet>
  );
}
