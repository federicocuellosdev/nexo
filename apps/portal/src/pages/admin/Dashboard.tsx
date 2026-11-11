import { useEffect, useState } from 'react';
import { Users, CreditCard, ShieldCheck, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { obtenerMetricasAdmin, type MetricasAdmin } from '@/lib/api';

interface TarjetaMetricaProps {
  titulo: string;
  valor: number | undefined;
  descripcion: string;
  icono: LucideIcon;
  cargando: boolean;
}

function TarjetaMetrica({ titulo, valor, descripcion, icono: Glifo, cargando }: TarjetaMetricaProps) {
  return (
    <div className="flex flex-col gap-4 rounded-card bg-white p-6 shadow-card ring-1 ring-ink-100">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-600">{titulo}</p>
          {/* El <p> siempre se renderiza para fijar el line-height (text-4xl
              + font-display). Adentro va el numero cuando hay valor, o un
              bloque skeleton con altura 1em (relativa al font-size del
              parent) mientras carga — asi la card no se desplaza cuando
              llega el dato. */}
          <p className="mt-2 font-display text-4xl text-ink-950">
            {cargando ? (
              <span
                aria-hidden="true"
                className="inline-block h-[1em] w-24 animate-pulse rounded-campo bg-ink-100 align-middle"
              />
            ) : (
              (valor?.toLocaleString('es-AR') ?? '—')
            )}
          </p>
        </div>
        <span
          aria-hidden="true"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-pill bg-marca-50 text-marca-700"
        >
          <Glifo size={20} strokeWidth={1.75} />
        </span>
      </div>
      <p className="text-sm text-ink-600">{descripcion}</p>
    </div>
  );
}

/**
 * Dashboard admin. Tres contadores que reflejan el funnel de alta:
 *   1. Leads: todas las filas de v3.leads (titulares) — cuántos arrancaron.
 *   2. Pagaron: titulares con mp_status='authorized' — cuántos convirtieron.
 *   3. Con cobertura: pagaron + perfil completo — cuántos están activos.
 *
 * Fetch al montar con el access_token de Supabase en el header. Si la llamada
 * falla queda '—' y se loguea; no mostramos error full-screen porque el
 * dashboard es informativo, no transaccional.
 */
export function AdminDashboard() {
  const [metricas, setMetricas] = useState<MetricasAdmin | undefined>(undefined);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelado = false;
    void (async () => {
      try {
        if (!supabase) {
          setError('Supabase no configurado');
          return;
        }
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          setError('Sesión expirada');
          return;
        }
        const resultado = await obtenerMetricasAdmin(token);
        if (!cancelado) setMetricas(resultado);
      } catch (err) {
        console.error('[AdminDashboard] metrics error', err);
        if (!cancelado) setError('No pudimos cargar las métricas');
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <div data-entrada className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl text-ink-950">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-600">Resumen del funnel de alta de Previnca Nexo.</p>
      </div>

      {error ? (
        <p role="alert" className="rounded-card bg-danger-50 px-4 py-3 text-sm text-danger-700 ring-1 ring-danger-500/30">
          {error}
        </p>
      ) : null}

      {/* Funnel: card → chevron → card → chevron → card. En lg usamos flex
          horizontal con cards que crecen y chevrones estaticos en el medio
          (indican la direccion lead→pago→cobertura). En mobile cada card
          va apilada y el chevron rota 90° abajo para seguir leyendose como
          progresion. */}
      <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
        <div className="flex-1">
          <TarjetaMetrica
            titulo="Leads generados"
            valor={metricas?.leads}
            descripcion="Titulares que arrancaron el alta."
            icono={Users}
            cargando={cargando}
          />
        </div>
        <ChevronRight
          size={24}
          aria-hidden="true"
          className="mx-auto shrink-0 rotate-90 text-ink-300 lg:rotate-0"
        />
        <div className="flex-1">
          <TarjetaMetrica
            titulo="Pagaron"
            valor={metricas?.pagaron}
            descripcion="Suscripciones MP autorizadas."
            icono={CreditCard}
            cargando={cargando}
          />
        </div>
        <ChevronRight
          size={24}
          aria-hidden="true"
          className="mx-auto shrink-0 rotate-90 text-ink-300 lg:rotate-0"
        />
        <div className="flex-1">
          <TarjetaMetrica
            titulo="Con cobertura"
            valor={metricas?.conCobertura}
            descripcion="Pagaron y completaron el perfil."
            icono={ShieldCheck}
            cargando={cargando}
          />
        </div>
      </div>
    </div>
  );
}
