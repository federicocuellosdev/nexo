import { useState } from 'react';
import { Link } from 'react-router';
import { ChevronDown, CircleAlert, Glasses, Pill, ShieldCheck, Stethoscope, UserPlus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { setSession, useSession, type Beneficiario } from '@/mock/session';
import { DialogoAgregarPersona } from '@/features/perfil/DialogoAgregarPersona';
import { derivarEstado } from '@/lib/estado';
import {
  planContratado,
  productosContratados,
  proximoVencimiento,
} from '@/features/cobertura/contrataciones';
import { CoberturaEstado } from '@/features/cobertura/CoberturaEstado';
import { PlanPrestaciones } from '@/features/planes/PlanPrestaciones';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { Money } from '@/ui/Money';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { clasesBoton } from '@/ui/Button';

const ETIQUETA_RELACION: Record<'conyuge' | 'hijo' | 'padre' | 'madre' | 'otro', string> = {
  conyuge: 'Cónyuge',
  hijo: 'Hijo/a',
  padre: 'Padre',
  madre: 'Madre',
  otro: 'Otro',
};

const COMO_USARLA = [
  {
    id: 'doc24',
    icono: Stethoscope,
    titulo: 'Telemedicina Doc24',
    texto:
      'Atención médica 24/7 desde casa. Tocá "Ir a Doc24", ingresá con tu email y tu primera consulta del mes es sin cargo.',
  },
  {
    id: 'farmacia',
    icono: Pill,
    titulo: 'Farmacia',
    texto:
      'Hasta 50% de descuento en medicamentos. Tocá "Buscar farmacias", acercate a la sucursal y mostrá tu credencial.',
  },
  {
    id: 'optica',
    icono: Glasses,
    titulo: 'Óptica',
    texto:
      'Un par de anteojos al año sin costo. Tocá "Buscar ópticas", elegí tu sucursal y retirá con tu credencial.',
  },
];

export function Coberturas() {
  const sesion = useSession();
  const estado = derivarEstado(sesion);
  const plan = planContratado(sesion);
  const productos = productosContratados(sesion);
  const vencimiento = proximoVencimiento(sesion);
  const [prestacionesAbiertas, setPrestacionesAbiertas] = useState(false);
  const [agregandoPersona, setAgregandoPersona] = useState(false);

  if (plan === undefined && productos.length === 0) {
    return (
      <div data-entrada className="flex flex-col gap-8">
        <div>
          {/*
            El h1 de la pantalla se conserva también en el camino vacío: es el
            título de la página, no un parche. Dispara para sinCuenta y
            conCuentaSinPago, los dos estados más comunes de un visitante nuevo.
          */}
          <h1 className="text-2xl text-ink-950">Mis coberturas</h1>
          <p className="mt-1 text-sm text-ink-600">Lo que tenés contratado y cómo usarlo.</p>
        </div>
        <EmptyState
          icono={ShieldCheck}
          // h2 y no el h3 por defecto: cuelga directo del h1 de la pantalla,
          // sin ningún encabezado intermedio. Antes saltaba de h1 a h3.
          como="h2"
          titulo="Todavía no tenés coberturas"
          descripcion="Cuando contrates un plan lo vas a ver acá con todas sus prestaciones."
        >
          <Link to="/planes" className={clasesBoton({})}>
            Ver planes
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div data-entrada className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl text-ink-950">Mis coberturas</h1>
        <p className="mt-1 text-sm text-ink-600">Lo que tenés contratado y cómo usarlo.</p>
      </div>

      {plan ? (
        <section aria-label="Plan contratado">
          {/* Header del plan + prestaciones DENTRO de la misma Card. Antes
              había dos Cards (identificación arriba, collapsible de
              prestaciones abajo) + un botón "Ver prestaciones" que las
              expandía. Se unificó: la cobertura es información de referencia,
              esconderla atrás de un toggle hace que el usuario tenga que
              clickear para ver lo mismo que ya vino a buscar. */}
          <Card className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <Icon icono={ShieldCheck} tono="marca" tamano="lg" />
                <div className="flex min-w-0 flex-col gap-1">
                  {/* Nombre + estado en una sola línea separados por `|`:
                      más denso visualmente que el chip en línea aparte y
                      deja el estado al lado del nombre del plan, donde se
                      lee junto. */}
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl text-ink-950">{plan.nombre}</h2>
                    <span aria-hidden="true" className="text-ink-300">|</span>
                    <CoberturaEstado estado={estado} />
                  </div>
                  {vencimiento ? (
                    <p className="text-sm text-ink-500">{`Próxima cuota: ${vencimiento}`}</p>
                  ) : null}
                </div>
              </div>

              {/* Jerarquía: los botones 'Usar mi cobertura' de abajo son la
                  primera (bg-brand). Acá 'Subir de plan' queda como segunda
                  jerarquía (secundario con ring) y 'Contratar servicios' es
                  terciario (fantasma / link).
                  Con perfil pendiente el único CTA es completarlo. */}
              <div className="flex flex-col gap-2 lg:basis-2/5 lg:shrink-0">
                {estado === 'pagadoSinPerfil' ? (
                  <Link to="/perfil/completar" className={clasesBoton({ ancho: 'full', tamano: 'lg' })}>
                    Completar perfil
                  </Link>
                ) : (
                  <>
                    {/* Subir de plan: fondo violeta tenue + borde + texto
                        violeta. Jerarquía visual intermedia entre los
                        accesos de marca (brand gradient) y el 'Otros
                        servicios' outline en negro. */}
                    <Link
                      to="/planes"
                      className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-pill bg-marca-50 px-5 text-base font-medium text-marca-700 ring-1 ring-marca-500 transition-colors hover:bg-marca-100"
                    >
                      Subir de plan
                    </Link>
                    {/* Otros servicios: secundario (ring-ink-200) — mismo
                        tratamiento que 'Subir de plan' y 'Descargar
                        credencial' del CoberturaCard de /inicio, para que
                        los CTAs de segunda jerarquía sean consistentes. */}
                    <Link to="/planes" className={clasesBoton({ variante: 'secundario', ancho: 'full' })}>
                      Otros servicios
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Accesos directos a los servicios que la gente usa de verdad.
                Las URLs son los destinos reales de cada servicio (Doc24 web,
                buscadores de Farmacity y Rosario Visión) y se abren en pestaña
                nueva: la persona está en el portal para consultar, no para
                navegar a un sitio externo y perder el contexto. */}
            {/* Mismo tratamiento que los Accesos rapidos de /inicio:
                degradado de marca + sombra elevada + icono blanco a 22px.
                Son los CTAs principales para USAR la cobertura, no acciones
                secundarias. */}
            <div className="border-t border-ink-100 pt-5">
              <h3 className="mb-3 text-base font-medium text-ink-900">Usar mi cobertura</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <a
                  href="https://www.doc24.com.ar/"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-elevar
                  className="flex items-center gap-3 rounded-card bg-brand-oscurecido px-5 py-5 text-white shadow-elevada"
                >
                  <Stethoscope size={22} strokeWidth={1.75} aria-hidden="true" className="text-white" />
                  <span className="text-sm font-medium">Ir a Doc24</span>
                </a>
                <a
                  href="https://www.farmacity.com/sucursales/?distance=5&province=santa-fe"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-elevar
                  className="flex items-center gap-3 rounded-card bg-brand-oscurecido px-5 py-5 text-white shadow-elevada"
                >
                  <Pill size={22} strokeWidth={1.75} aria-hidden="true" className="text-white" />
                  <span className="text-sm font-medium">Buscar farmacias</span>
                </a>
                <a
                  href="https://www.rosariovision.com.ar/sucursales"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-elevar
                  className="flex items-center gap-3 rounded-card bg-brand-oscurecido px-5 py-5 text-white shadow-elevada"
                >
                  <Glasses size={22} strokeWidth={1.75} aria-hidden="true" className="text-white" />
                  <span className="text-sm font-medium">Buscar ópticas</span>
                </a>
              </div>
            </div>

            {/* Prestaciones adentro de un desplegable: por default cerrado.
                Es información de referencia a la que se entra dos veces por
                año (cuando hay que confirmar un copago, o antes de elegir
                upgrade), no la primera lectura cuando se abre /coberturas. */}
            <div className="border-t border-ink-100 pt-4">
              <button
                type="button"
                aria-expanded={prestacionesAbiertas}
                aria-controls="tabla-prestaciones"
                onClick={() => setPrestacionesAbiertas((v) => !v)}
                className={cn(
                  'flex w-full cursor-pointer items-center justify-between gap-3 text-left',
                  // Línea tenue sólo cuando está expandido: separa el toggle
                  // del contenido que aparece abajo. Cuando está cerrado el
                  // border queda transparente para no ensuciar el estado.
                  prestacionesAbiertas ? 'border-b border-ink-100 pb-3' : 'border-b border-transparent pb-0',
                )}
              >
                <span className="text-base font-medium text-ink-900">
                  {`Coberturas del plan ${plan.nombre}`}
                </span>
                <ChevronDown
                  size={20}
                  aria-hidden="true"
                  className={cn(
                    'shrink-0 text-ink-500 transition-transform duration-200',
                    prestacionesAbiertas && 'rotate-180',
                  )}
                />
              </button>
              <div
                id="tabla-prestaciones"
                className={cn(
                  'grid overflow-hidden transition-[grid-template-rows,visibility] duration-300 ease-out',
                  prestacionesAbiertas ? 'mt-3 grid-rows-[1fr] visible' : 'grid-rows-[0fr] invisible',
                )}
                aria-hidden={!prestacionesAbiertas}
              >
                <div className="min-h-0 overflow-hidden">
                  <PlanPrestaciones prestaciones={plan.prestaciones} />
                </div>
              </div>
            </div>
          </Card>
        </section>
      ) : null}

      {/* Sección Familiares: va directo debajo del plan contratado. Grid con
          una card por beneficiario del perfil + una card 'Agregar persona'
          siempre al final. Sin plan: la sección queda grisada (opacity-60)
          con una card placeholder deshabilitada — visible para que el
          usuario entienda que el plan la habilita, pero sin acciones. */}
      <section aria-label="Familiares" className={cn('flex flex-col gap-4', !plan && 'opacity-60')}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl text-ink-950">Familiares</h2>
          {!plan ? (
            <span className="text-sm text-ink-500">Contratá un plan para sumar adherentes.</span>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plan
            ? (sesion.perfil?.beneficiarios ?? []).map((ben, i) => (
                <Card key={`${ben.numeroDocumento}-${i}`} className="flex items-center gap-3 p-4">
                  <span
                    aria-hidden="true"
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-pill bg-marca-50 text-sm font-semibold text-marca-700"
                  >
                    {(ben.nombre[0] ?? '').toUpperCase()}
                    {(ben.apellido[0] ?? '').toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900">
                      {`${ben.nombre} ${ben.apellido}`.trim()}
                    </p>
                    <p className="text-xs capitalize text-ink-500">{ETIQUETA_RELACION[ben.relacion]}</p>
                  </div>
                </Card>
              ))
            : null}

          {/* Card de "Agregar persona". Siempre al final. Clickeable solo con
              plan contratado — sin plan queda como placeholder deshabilitado. */}
          {plan ? (
            <button
              type="button"
              onClick={() => setAgregandoPersona(true)}
              className="flex cursor-pointer items-center gap-3 rounded-card border-2 border-dashed border-ink-200 bg-transparent p-4 text-left transition-colors hover:border-marca-400 hover:bg-marca-50/40"
            >
              <span
                aria-hidden="true"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-pill bg-marca-50 text-marca-600"
              >
                <UserPlus size={18} strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink-900">Agregar persona</p>
                <p className="text-xs text-ink-500">Sumá un adherente al plan</p>
              </div>
            </button>
          ) : (
            <div className="flex cursor-not-allowed items-center gap-3 rounded-card border-2 border-dashed border-ink-200 bg-ink-50/40 p-4">
              <span
                aria-hidden="true"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-pill bg-ink-100 text-ink-400"
              >
                <UserPlus size={18} strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink-400">Agregar persona</p>
                <p className="text-xs text-ink-400">Requiere plan contratado</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {productos.length > 0 ? (
        <section aria-label="Productos contratados">
          <h2 className="mb-3 text-xl text-ink-950">Productos contratados</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {productos.map((producto) => (
              <Card key={producto.id} className="flex flex-col gap-2">
                <h3 className="text-base font-medium text-ink-950">{producto.nombre}</h3>
                <p className="text-sm text-ink-600">{producto.detalle}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Money monto={producto.precio} periodo="por mes" />
                  {producto.pendiente ? (
                    <Chip tono="warn" icono={CircleAlert}>
                      a confirmar
                    </Chip>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-label="Cómo usar tu cobertura">
        <h2 className="mb-3 text-xl text-ink-950">Cómo usar tu cobertura</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COMO_USARLA.map((item) => (
            <Card key={item.id} className="flex flex-col gap-3">
              <Icon icono={item.icono} tono="marca" />
              <h3 className="text-base font-medium text-ink-950">{item.titulo}</h3>
              <p className="text-sm text-ink-600">{item.texto}</p>
            </Card>
          ))}
        </div>
      </section>

      {agregandoPersona ? (
        <DialogoAgregarPersona
          onCerrar={() => setAgregandoPersona(false)}
          onAgregar={(beneficiario: Beneficiario) => {
            // Agrega el beneficiario al perfil persistido Y aumenta el
            // contador de familiares (el que usa el wizard y /sales).
            const perfilActual = sesion.perfil;
            if (perfilActual) {
              setSession({
                perfil: {
                  ...perfilActual,
                  beneficiarios: [...(perfilActual.beneficiarios ?? []), beneficiario],
                },
                familiares: (sesion.familiares ?? 0) + 1,
              });
            } else {
              // Si todavía no completó el perfil, solo bumpamos el contador.
              // Cuando entre al wizard, se le va a reservar el slot vacío.
              setSession({ familiares: (sesion.familiares ?? 0) + 1 });
            }
            setAgregandoPersona(false);
          }}
        />
      ) : null}
    </div>
  );
}
