import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { Card } from '@/ui/Card';
import { Field } from '@/ui/Field';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { Money } from '@/ui/Money';
import { cn } from '@/lib/cn';
import { portalUrl } from '@/lib/urls';
import { guardarHandoff } from '@/lib/handoff';
import { crearLead, ApiError } from '@/lib/api';
import { capturarTrazabilidad } from '@/lib/trazabilidad';
import { buscarPlan, buscarProducto } from '@/mock/planes';
import {
  DATOS_ALTA_VACIOS,
  hayErrores,
  validarAlta,
  validarPaso1,
  type DatosAlta,
  type ErroresAlta,
} from '@/features/alta/validacion';

/**
 * Versión página del alta. Reemplaza al popup `AltaDialog` para mantener la
 * misma gramática visual del portal: full-page con header + subtítulo +
 * `Card` con el wizard adentro (ver `apps/portal/src/pages/PerfilCompletar.tsx`
 * y `PerfilWizard` para el patrón canónico).
 *
 * URL: `/contratar/:tipo/:id` (ej. `/contratar/plan/nexo-2`,
 * `/contratar/producto/hogar-1`). Si el id no matchea, bounce a `/catalogo`.
 */
type ItemContratar = {
  tipo: 'plan' | 'producto';
  id: string;
  nombre: string;
  precio: number;
};

function resolverItem(tipo: string | undefined, id: string | undefined): ItemContratar | null {
  if (id === undefined) return null;
  if (tipo === 'plan') {
    const plan = buscarPlan(id);
    return plan ? { tipo: 'plan', id: plan.slug, nombre: plan.nombre, precio: plan.precio } : null;
  }
  if (tipo === 'producto') {
    const producto = buscarProducto(id);
    return producto
      ? { tipo: 'producto', id: producto.id, nombre: producto.nombre, precio: producto.precio }
      : null;
  }
  return null;
}

type PasoAlta = 1 | 2;

const ORDEN_CAMPOS: Array<keyof DatosAlta> = ['nombre', 'apellido', 'email', 'telefono', 'dni'];
const CAMPOS_PASO_1: Array<keyof DatosAlta> = ['nombre', 'apellido', 'email', 'telefono'];

function idDelCampo(campo: keyof DatosAlta): string {
  return `alta-${campo}`;
}

function enfocarCampo(id: string) {
  document.getElementById(id)?.focus();
}

export function Contratar() {
  const { tipo, id } = useParams<{ tipo: string; id: string }>();
  const item = resolverItem(tipo, id);

  if (item === null) {
    // Sin fallback silencioso: un id roto manda al catálogo. React Router
    // Navigate con `replace` evita ensuciar el history.
    return <Navigate to="/catalogo" replace />;
  }

  return (
    <div className="mx-auto max-w-[560px] px-4 pt-6 pb-16 lg:pt-10">
      <h1 className="text-2xl text-ink-950">Contratar {item.nombre}</h1>
      <p className="mt-2 text-sm text-ink-600">
        Son 2 pasos cortos: tus datos y el documento. Después te mandamos un enlace al email para
        confirmar.
      </p>
      <div className="mt-6">
        <AltaCard item={item} />
      </div>
    </div>
  );
}

interface AltaCardProps {
  item: ItemContratar;
}

function AltaCard({ item }: AltaCardProps) {
  const navegar = useNavigate();
  const [paso, setPaso] = useState<PasoAlta>(1);
  const [datos, setDatos] = useState<DatosAlta>(DATOS_ALTA_VACIOS);
  const [errores, setErrores] = useState<ErroresAlta>({});
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  // Autofoco del primer campo del paso. `requestAnimationFrame` espera un
  // frame para ganarle al foco default del browser (que caería en el link
  // de volver, por ejemplo).
  useEffect(() => {
    const marco = requestAnimationFrame(() => {
      enfocarCampo(paso === 1 ? idDelCampo('nombre') : idDelCampo('dni'));
    });
    return () => cancelAnimationFrame(marco);
  }, [paso]);

  function actualizar(campo: keyof DatosAlta, valor: string) {
    setDatos((previos) => ({ ...previos, [campo]: valor }));
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;

    // Paso 1: validar los 4 campos personales. Si todo OK, avanzar al paso 2.
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
        canal: 'landing',
        ...capturarTrazabilidad(),
      });
      guardarHandoff({ intent: 'alta', tipo: item.tipo, id: item.id, usuario });
      void navegar('/revisa-tu-mail');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.cuerpo.error === 'payload_invalido' && err.cuerpo.detalles) {
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

  const tituloPaso = paso === 1 ? 'Tus datos' : 'Documento';

  return (
    <Card className="flex flex-col gap-5">
      {/* Mismo patron que PerfilWizard: titulo del paso arriba + dots */}
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-ink-500">{`Paso ${paso} de 2`}</span>
          <span className="text-sm text-ink-600">{tituloPaso}</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={paso}
          aria-valuemin={1}
          aria-valuemax={2}
          aria-label="Progreso del alta"
          className="mt-3 flex items-center gap-2"
        >
          {[1, 2].map((n) => (
            <span
              key={n}
              aria-hidden="true"
              className={cn(
                'size-2 rounded-pill transition-colors duration-200',
                n <= paso ? 'bg-marca-600' : 'bg-ink-200',
              )}
            />
          ))}
        </div>
      </div>

      {/* Resumen del plan enmarcado entre dos lineas tenues, igual que en el
          popup anterior: el usuario tiene presente qué está contratando sin
          tener que hacer scroll al header. */}
      <div className="border-t border-ink-100" aria-hidden="true" />
      <div className="rounded-campo bg-ink-50 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-ink-800">{item.nombre}</span>
          <Money monto={item.precio} periodo="por mes" />
        </div>
      </div>
      <div className="border-t border-ink-100" aria-hidden="true" />

      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        <input type="hidden" name="itemTipo" value={item.tipo} />
        <input type="hidden" name="itemId" value={item.id} />

        {paso === 1 ? (
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
                value={datos.telefono}
                onChange={(evento) => actualizar('telefono', evento.target.value.replace(/[^\d+]/g, ''))}
              />
            </Field>
          </>
        ) : (
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
              value={datos.dni}
              onChange={(evento) => actualizar('dni', evento.target.value.replace(/\D/g, ''))}
            />
          </Field>
        )}

        {errorEnvio ? (
          <div
            role="alert"
            className="rounded-campo border border-danger-500/30 bg-danger-50 px-4 py-3 text-sm text-danger-700"
          >
            {errorEnvio}
          </div>
        ) : null}

        {paso === 2 ? (
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
            Continuar
          </Button>
        )}

        <p className="text-center text-sm text-ink-600">
          ¿Ya sos socio?{' '}
          {/* /ingresar vive en el portal (otro origen). Mismo tratamiento que
              el link "Ingresar" del header: anchor nativo, no react-router. */}
          <a
            href={`${portalUrl()}/ingresar`}
            className="font-medium text-marca-600 underline underline-offset-2 hover:text-marca-700"
          >
            Ya tengo cuenta
          </a>
        </p>
      </form>
    </Card>
  );
}
