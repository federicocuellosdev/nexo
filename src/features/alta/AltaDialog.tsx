import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { CircleAlert } from 'lucide-react';
import { Sheet } from '@/ui/Sheet';
import { Field } from '@/ui/Field';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { Money } from '@/ui/Money';
import { Chip } from '@/ui/Chip';
import { guardarHandoff } from '@/lib/handoff';
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
const ORDEN_CAMPOS: Array<keyof DatosAlta> = ['nombre', 'apellido', 'email', 'telefono'];

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

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

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

    guardarHandoff({
      intent: 'alta',
      tipo: item.tipo,
      id: item.id,
      usuario: {
        nombre: datos.nombre.trim(),
        apellido: datos.apellido.trim(),
        email: datos.email.trim(),
        telefono: datos.telefono.trim(),
      },
    });
    void navegar('/revisa-tu-mail');
  }

  return (
    <Sheet abierto={abierto} onCambio={onCambio} titulo={`Contratar ${item.nombre}`}>
      {/* Resumen visible de lo que se contrata: el usuario tiene que ver qué
          está por pagar sin volver atrás. */}
      <div className="mb-5 flex items-center justify-between gap-3 rounded-campo bg-ink-50 px-4 py-3">
        <span className="text-sm font-medium text-ink-800">{item.nombre}</span>
        <div className="flex items-center gap-2">
          <Money monto={item.precio} periodo="por mes" />
          {item.pendiente ? (
            <Chip tono="warn" icono={CircleAlert}>
              a confirmar
            </Chip>
          ) : null}
        </div>
      </div>

      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        <input type="hidden" name="itemTipo" value={item.tipo} readOnly />
        <input type="hidden" name="itemId" value={item.id} readOnly />

        {modo === 'alta' ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre" htmlFor="alta-nombre" error={errores.nombre} requerido>
                <Input
                  id="alta-nombre"
                  name="nombre"
                  autoComplete="given-name"
                  value={datos.nombre}
                  onChange={(evento) => actualizar('nombre', evento.target.value)}
                />
              </Field>
              <Field label="Apellido" htmlFor="alta-apellido" error={errores.apellido} requerido>
                <Input
                  id="alta-apellido"
                  name="apellido"
                  autoComplete="family-name"
                  value={datos.apellido}
                  onChange={(evento) => actualizar('apellido', evento.target.value)}
                />
              </Field>
            </div>

            <Field label="Email" htmlFor="alta-email" error={errores.email} requerido>
              <Input
                id="alta-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={datos.email}
                onChange={(evento) => actualizar('email', evento.target.value)}
              />
            </Field>

            <Field
              label="Teléfono"
              htmlFor="alta-telefono"
              error={errores.telefono}
              ayuda="Sin 0 ni 15"
              requerido
            >
              <Input
                id="alta-telefono"
                name="telefono"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={datos.telefono}
                onChange={(evento) => actualizar('telefono', evento.target.value)}
              />
            </Field>
          </>
        ) : (
          <Field label="Email" htmlFor="alta-email" error={errores.email} requerido>
            <Input
              id="alta-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={datos.email}
              onChange={(evento) => actualizar('email', evento.target.value)}
            />
          </Field>
        )}

        <Button type="submit" ancho="full" tamano="lg">
          {modo === 'alta' ? 'Crear mi cuenta' : 'Enviarme el enlace'}
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
