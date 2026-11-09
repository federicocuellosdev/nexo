import { useState } from 'react';
import { Link } from 'react-router';
import { ChevronDown, CircleAlert, Glasses, Pill, ShieldCheck, Stethoscope } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useSession } from '@/mock/session';
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

const COMO_USARLA = [
  {
    id: 'doc24',
    icono: Stethoscope,
    titulo: 'Telemedicina Doc24',
    texto:
      'Consultá un médico sin moverte de casa, 24/7. Tocá "Ir a Doc24", ingresá con tu email y conectate en minutos — tu primera consulta del mes va sin cargo.',
  },
  {
    id: 'farmacia',
    icono: Pill,
    titulo: 'Farmacia',
    texto:
      'Hasta 50% de descuento en tus medicamentos. Tocá "Buscar farmacias", encontrá la sucursal más cercana y pedí el beneficio mostrando tu credencial en el mostrador.',
  },
  {
    id: 'optica',
    icono: Glasses,
    titulo: 'Óptica',
    texto:
      'Tu par de anteojos al año sin costo extra. Tocá "Buscar ópticas", elegí la sucursal más cercana de Rosario Visión y retirá armazón + cristales presentando tu credencial.',
  },
];

export function Coberturas() {
  const sesion = useSession();
  const estado = derivarEstado(sesion);
  const plan = planContratado(sesion);
  const productos = productosContratados(sesion);
  const vencimiento = proximoVencimiento(sesion);
  const [prestacionesAbiertas, setPrestacionesAbiertas] = useState(false);

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
                  <div className="mt-1">
                    <Money monto={plan.precio} periodo="por mes" />
                  </div>
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
                    {/* Otros servicios: outline negro, el CTA de menor peso. */}
                    <Link
                      to="/planes"
                      className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-pill bg-transparent px-5 text-base font-medium text-ink-900 ring-1 ring-ink-900 transition-colors hover:bg-ink-50"
                    >
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
                className="flex w-full cursor-pointer items-center justify-between gap-3 text-left"
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
    </div>
  );
}
