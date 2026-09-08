import { Link, useLocation } from 'react-router';
import { LayoutGrid, Receipt, ShieldCheck, Sparkles } from 'lucide-react';
import { useSession } from '@/mock/session';
import { derivarEstado } from '@/lib/estado';
import { NOVEDADES } from '@/mock/novedades';
import { NovedadesCarousel } from '@/features/novedades/NovedadesCarousel';
import { CoberturaCard } from '@/features/cobertura/CoberturaCard';
import { formatearFecha, planContratado, proximoVencimiento } from '@/features/cobertura/contrataciones';
import { Icon } from '@/ui/Icon';
import { Money } from '@/ui/Money';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { clasesBoton } from '@/ui/Button';

const ACCESOS = [
  { to: '/coberturas', label: 'Ver coberturas', icono: ShieldCheck },
  { to: '/planes', label: 'Contratar producto', icono: LayoutGrid },
  { to: '/movimientos', label: 'Mis movimientos', icono: Receipt },
];

export function Inicio() {
  const sesion = useSession();
  const { state } = useLocation();
  const estado = derivarEstado(sesion);
  const plan = planContratado(sesion);
  const vencimiento = proximoVencimiento(sesion);
  const ultimos = sesion.ordenes.slice(0, 3);

  // `state` viene de PerfilCompletar tras guardar el perfil, pero por sí solo no
  // alcanza: dice lo que creyó la pantalla anterior, no lo que pasó. Sin cruzarlo
  // contra el estado real, alguien que nunca pagó completaba el perfil y veía
  // "Cobertura activa" con el cartel "Todavía no tenés un plan" justo debajo.
  const avisoDeNavegacion =
    typeof state === 'object' && state !== null && (state as { coberturaActivada?: unknown }).coberturaActivada === true;
  const reciénActivada = avisoDeNavegacion && estado === 'activo';

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl text-ink-950">{`Hola, ${sesion.usuario?.nombre ?? ''}`}</h1>
        <p className="mt-1 text-sm text-ink-600">Este es el resumen de tu cobertura.</p>
      </div>

      {reciénActivada ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-card bg-ok-50 px-4 py-3 text-sm font-medium text-ok-700"
        >
          <Sparkles size={16} aria-hidden="true" />
          Cobertura activa. Ya podés usar todas tus prestaciones.
        </p>
      ) : null}

      <section aria-label="Novedades">
        <h2 className="mb-3 text-xl text-ink-950">Novedades</h2>
        <NovedadesCarousel novedades={NOVEDADES} />
      </section>

      <section aria-label="Tu cobertura">
        {plan && vencimiento ? (
          <CoberturaCard plan={plan} estado={estado} proximoVencimiento={vencimiento} />
        ) : (
          <EmptyState
            icono={ShieldCheck}
            titulo="Todavía no tenés un plan"
            descripcion="Elegí el plan que mejor te sirva y activá tu cobertura."
          >
            <Link to="/planes" className={clasesBoton({})}>
              Ver planes
            </Link>
          </EmptyState>
        )}
      </section>

      <section aria-label="Accesos rápidos">
        <h2 className="mb-3 text-xl text-ink-950">Accesos rápidos</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {ACCESOS.map((acceso) => (
            <Link
              key={acceso.to}
              to={acceso.to}
              className="flex items-center gap-3 rounded-card bg-white p-4 shadow-suave ring-1 ring-ink-100 transition-shadow duration-200 hover:shadow-card"
            >
              <Icon icono={acceso.icono} tono="marca" tamano="sm" />
              <span className="text-sm font-medium text-ink-900">{acceso.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-label="Últimos movimientos">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-xl text-ink-950">Últimos movimientos</h2>
          <Link to="/movimientos" className="text-sm font-medium text-marca-600 hover:text-marca-700">
            Ver todos
          </Link>
        </div>

        {ultimos.length === 0 ? (
          <EmptyState
            icono={Receipt}
            titulo="Todavía no hay movimientos"
            descripcion="Acá van a aparecer tus pagos y contrataciones."
          />
        ) : (
          <div className="overflow-hidden rounded-card bg-white shadow-card ring-1 ring-ink-100">
            <ul className="divide-y divide-ink-100">
              {ultimos.map((orden) => (
                <li key={orden.id} className="flex items-center gap-3 px-4 py-3">
                  <Icon icono={Receipt} tono="neutro" tamano="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">{orden.concepto}</p>
                    <p className="text-xs text-ink-500">{formatearFecha(orden.fecha)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Chip tono={orden.estado === 'pagada' ? 'ok' : 'warn'}>
                      {orden.estado === 'pagada' ? 'Pagada' : 'Pendiente'}
                    </Chip>
                    <Money monto={orden.monto} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
