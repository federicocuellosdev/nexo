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
  validarPaso1,
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
type PasoAlta = 1 | 2;

// Orden visual de los campos (de arriba hacia abajo): decide a cuál volver el
// foco cuando el envío falla con más de un error a la vez.
const ORDEN_CAMPOS: Array<keyof DatosAlta> = ['nombre', 'apellido', 'email', 'telefono', 'dni'];
const CAMPOS_PASO_1: Array<keyof DatosAlta> = ['nombre', 'apellido', 'email', 'telefono'];

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
  // Alta en dos pasos: paso 1 pide nombre/apellido/email/teléfono, paso 2
  // pide solo el DNI. Se dividió porque la pantalla única con 5 campos
  // intimidaba y el DNI es el único que no se pedía antes — separarlo deja
  // claro que ese dato específico es para la póliza.
  const [paso, setPaso] = useState<PasoAlta>(1);
  const [datos, setDatos] = useState<DatosAlta>(DATOS_ALTA_VACIOS);
  const [errores, setErrores] = useState<ErroresAlta>({});
  // `enviando` deshabilita el submit mientras el request a /api/leads está en
  // vuelo (evita doble click → doble lead). `errorEnvio` muestra un mensaje
  // general cuando el backend devuelve error no atribuible a un campo.
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  // Al reabrir el popup arranca siempre en modo alta paso 1, sin datos ni
  // errores de un intento anterior: si alguien cerró estando en modo login,
  // o cerró después de un submit fallido, la próxima apertura no hereda
  // ese estado.
  useEffect(() => {
    if (!abierto) return;
    setModo('alta');
    setPaso(1);
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
      if (modo === 'login') enfocarCampo(idDelCampo('email'));
      else if (paso === 1) enfocarCampo(idDelCampo('nombre'));
      else enfocarCampo(idDelCampo('dni'));
    });
    return () => cancelAnimationFrame(marco);
  }, [abierto, modo, paso]);

  function cambiarModo(nuevo: Modo) {
    setModo(nuevo);
    setPaso(1);
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

    // Paso 1: validar los 4 campos personales. Si todo OK, avanzar al paso 2
    // (DNI). Nada se manda al backend todavia.
    if (paso === 1) {
      const encontrados = validarPaso1(datos);
      if (hayErrores(encontrados)) {
        setErrores(encontrados);
        const primero = CAMPOS_PASO_1.find((campo) => encontrados[campo] !== undefined);
        if (primero) enfocarCampo(idDelCampo(primero));
        return;
      }
      setErrores({});
      setPaso(2);
      return;
    }

    // Paso 2: validar todo (incluido DNI) y disparar el POST.
    const encontrados = validarAlta(datos);
    if (hayErrores(encontrados)) {
      setErrores(encontrados);
      const primerCampoConError = ORDEN_CAMPOS.find((campo) => encontrados[campo] !== undefined);
      if (primerCampoConError) {
        // Si el error es en un campo del paso 1, volver al paso 1 y enfocarlo.
        if (CAMPOS_PASO_1.includes(primerCampoConError)) setPaso(1);
        enfocarCampo(idDelCampo(primerCampoConError));
      }
      return;
    }

    const usuario = {
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      email: datos.email.trim(),
      telefono: datos.telefono.trim(),
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
            if (primerCampoConError) {
              if (CAMPOS_PASO_1.includes(primerCampoConError)) setPaso(1);
              enfocarCampo(idDelCampo(primerCampoConError));
            }
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

  // Indicador de progreso pill con dos pasos. Mas claro que el "Paso 1 de 2 ·
  // Tus datos" como texto suelto: el bar visual anuncia de entrada que son
  // dos pantallas, no cuatro, y el usuario no se sorprende en el submit. En
  // modo login no se muestra (es un solo paso).
  const indicadorPaso = (
    <div className="flex items-center gap-2" aria-label={`Paso ${paso} de 2`}>
      <span
        className={`h-1.5 flex-1 rounded-pill transition-colors duration-200 ${
          paso >= 1 ? 'bg-marca-500' : 'bg-ink-100'
        }`}
      />
      <span
        className={`h-1.5 flex-1 rounded-pill transition-colors duration-200 ${
          paso >= 2 ? 'bg-marca-500' : 'bg-ink-100'
        }`}
      />
      <span className="ml-2 text-[11px] font-medium uppercase tracking-wide text-ink-500">
        {paso === 1 ? 'Tus datos' : 'Documento'}
      </span>
    </div>
  );

  return (
    <Sheet abierto={abierto} onCambio={onCambio} titulo={`Contratar ${item.nombre}`}>
      {/* Resumen visible de lo que se contrata: el usuario tiene que ver qué
          está por pagar sin volver atrás. Línea tenue abajo marca el cierre
          del "qué estás contratando" y el arranque del "quién sos". */}
      <div className="rounded-campo bg-ink-50 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-ink-800">{item.nombre}</span>
          <Money monto={item.precio} periodo="por mes" />
        </div>
      </div>
      <div className="my-5 border-t border-ink-100" aria-hidden="true" />

      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        <input type="hidden" name="itemTipo" value={item.tipo} />
        <input type="hidden" name="itemId" value={item.id} />

        {modo === 'alta' ? (
          paso === 1 ? (
            <>
              {indicadorPaso}
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

              <Field
                label="Teléfono"
                htmlFor={idDelCampo('telefono')}
                error={errores.telefono}
                ayuda="Para avisarte de tu cobertura, pagos y renovaciones."
                requerido
              >
                <Input
                  id={idDelCampo('telefono')}
                  name="telefono"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="3415551234"
                  value={datos.telefono}
                  onChange={(evento) => actualizar('telefono', evento.target.value.replace(/[^\d+]/g, ''))}
                />
              </Field>
            </>
          ) : (
            <>
              {indicadorPaso}
              {/* DNI: SF lo usa como clave de reconocimiento del Prospecto
                  (documentType=DNI + documentNumber). Sin esto el envío a
                  /leads rebota 400. Lo pedimos en paso aparte para que el
                  usuario entienda que es un dato especifico de la poliza. */}
              <Field
                label="DNI"
                htmlFor={idDelCampo('dni')}
                error={errores.dni}
                ayuda="Es el documento con el que Previnca te emite la póliza."
                requerido
              >
                <Input
                  id={idDelCampo('dni')}
                  name="dni"
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  autoComplete="off"
                  placeholder="34567890"
                  value={datos.dni}
                  onChange={(evento) => actualizar('dni', evento.target.value.replace(/\D/g, ''))}
                />
              </Field>
            </>
          )
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

        {modo === 'alta' && paso === 2 ? (
          <div className="flex flex-col gap-3 sm:flex-row-reverse">
            <Button type="submit" ancho="full" tamano="lg" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Crear cuenta'}
            </Button>
            <Button
              type="button"
              variante="secundario"
              ancho="full"
              tamano="lg"
              disabled={enviando}
              onClick={() => {
                setErrores({});
                setPaso(1);
              }}
            >
              Volver
            </Button>
          </div>
        ) : (
          <Button type="submit" ancho="full" tamano="lg" disabled={enviando}>
            {modo === 'login'
              ? 'Enviarme el enlace'
              : paso === 1
                ? 'Continuar'
                : enviando
                  ? 'Enviando…'
                  : 'Crear cuenta'}
          </Button>
        )}

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
