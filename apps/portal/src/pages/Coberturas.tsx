import { useState } from 'react';
import { Link } from 'react-router';
import { Brain, ChevronDown, CircleAlert, Pill, ShieldCheck, Siren, Smile, Stethoscope } from 'lucide-react';
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
    id: 'clinico',
    icono: Stethoscope,
    titulo: 'Médico Clínico',
    texto: 'Tu primera consulta del mes es sin cargo. El resto se cubre con las prestaciones del plan.',
  },
  {
    id: 'psicologia',
    icono: Brain,
    titulo: 'Psicología',
    texto: 'Primera sesión a $15.000 bonificada. Reservá desde el botón "Psicología" y elegí profesional.',
  },
  {
    id: 'emergencias',
    icono: Siren,
    titulo: 'Emergencias médicas',
    texto: 'Asistencia inmediata 24 horas ante urgencias de salud.',
  },
  {
    id: 'odontologia',
    icono: Smile,
    titulo: 'Guardia odontológica',
    texto: 'Atención ante dolores agudos y urgencias dentales.',
  },
  {
    id: 'farmacia',
    icono: Pill,
    titulo: 'Descuentos en farmacias',
    texto: 'Hasta 50% de descuento en farmacias adheridas. Mostrás la credencial en la caja.',
  },
];

/**
 * Acceso rápido a una cobertura. Si viene `href`, abre en pestaña nueva;
 * si no, se renderiza como `<button disabled>` con el mismo look pero sin
 * acción — placeholder visual hasta que Previnca defina destino.
 */
function AccesoCobertura({
  icono: Glifo,
  label,
  descripcion,
  href,
  copago = false,
}: {
  icono: typeof Stethoscope;
  label: string;
  descripcion?: string;
  href?: string;
  /** Marca el servicio como copago (on-demand): no viene en el plan base,
   *  se cobra aparte por sesión (ej. Psicología → SF `COB-OTR-020`). */
  copago?: boolean;
}) {
  const clases =
    'flex items-center gap-3 rounded-card bg-brand-oscurecido px-5 py-4 text-left text-white shadow-elevada transition-opacity';
  const contenido = (
    <>
      <Glifo size={22} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-white" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-2">
          <span className="text-sm font-medium leading-tight">{label}</span>
          {copago ? (
            <span className="shrink-0 rounded-pill bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Copago
            </span>
          ) : null}
        </span>
        {descripcion ? (
          <span className="text-xs text-white/80 leading-tight">{descripcion}</span>
        ) : null}
      </span>
    </>
  );
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        data-elevar
        className={cn(clases, 'hover:opacity-95')}
      >
        {contenido}
      </a>
    );
  }
  return (
    <button
      type="button"
      disabled
      aria-label={`${label} — próximamente`}
      className={cn(clases, 'cursor-not-allowed opacity-70')}
    >
      {contenido}
    </button>
  );
}

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
              {/* 5 accesos del plan Nexo. Hoy solo Psicología tiene link
                  (videoconsulta de Previnca v1). El resto son placeholders
                  visuales hasta que Previnca defina destino — se renderizan
                  como <button disabled> para preservar la UI y dejar explícito
                  que son no-interactivos (no silenciosamente "rotos"). */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <AccesoCobertura
                  icono={Stethoscope}
                  label="Médico Clínico"
                  descripcion="1° Consulta sin cargo"
                  href="https://doctorprevinca.videoconsultas.app/paciente/autogestion"
                />
                <AccesoCobertura
                  icono={Brain}
                  label="Psicología"
                  descripcion="1° Sesión a $15.000"
                  href="https://doctorprevinca.videoconsultas.app/paciente/autogestion"
                />
                <AccesoCobertura
                  icono={Siren}
                  label="Emergencias médicas"
                  descripcion="Asistencia 24 horas"
                />
                <AccesoCobertura
                  icono={Smile}
                  label="Guardia odontológica"
                  descripcion="Dolores agudos y urgencias"
                />
                <AccesoCobertura
                  icono={Pill}
                  label="Descuentos en farmacias"
                  descripcion="Hasta 50% off en adheridas"
                />
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
