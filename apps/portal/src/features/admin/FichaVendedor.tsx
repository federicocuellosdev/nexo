import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Users, CreditCard, ShieldCheck, Copy, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { supabase } from '@/lib/supabase';
import { landingUrl } from '@/lib/urls';
import {
  obtenerVendedorAdmin,
  obtenerMetricasVendedorAdmin,
  type VendedorAdmin,
  type MetricasAdmin,
} from '@/lib/api';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Skeleton } from '@/ui/Skeleton';

type Rango = '7' | '14' | '30' | 'mes' | 'todo';

const OPCIONES_RANGO: Array<{ valor: Rango; label: string }> = [
  { valor: 'mes', label: 'Este mes' },
  { valor: '7', label: '7 días' },
  { valor: '14', label: '14 días' },
  { valor: '30', label: '30 días' },
  { valor: 'todo', label: 'Todo' },
];

/** Deriva `{desde, hasta}` ISO strings del rango seleccionado para pasar
 *  como query al endpoint de métricas. `null` significa "sin cota". */
function derivarRango(rango: Rango): { desde: string | null; hasta: string | null } {
  if (rango === 'todo') return { desde: null, hasta: null };
  if (rango === 'mes') {
    const hoy = new Date();
    const primer = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    return { desde: primer.toISOString(), hasta: null };
  }
  const dias = parseInt(rango, 10);
  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
  return { desde: desde.toISOString(), hasta: null };
}

function inicialesDe(nombre: string, apellido: string): string {
  const n = (nombre.charAt(0) + apellido.charAt(0)).trim();
  return n ? n.toUpperCase() : '—';
}

export interface FichaVendedorProps {
  vendedorId: string;
  onVolver: () => void;
}

/**
 * Ficha de un vendedor para el admin. Layout de dos columnas como FichaLead:
 * izquierda sticky con la identidad (avatar + nombre + email + código),
 * derecha con los KPIs del vendedor (3 cards reutilizando el patrón del
 * Dashboard) + filtros de rango temporal + datos completos.
 */
export function FichaVendedor({ vendedorId, onVolver }: FichaVendedorProps) {
  const [vendedor, setVendedor] = useState<VendedorAdmin | null>(null);
  const [metricas, setMetricas] = useState<MetricasAdmin | undefined>(undefined);
  const [cargando, setCargando] = useState(true);
  const [cargandoMetricas, setCargandoMetricas] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [rango, setRango] = useState<Rango>('mes');
  const [copiado, setCopiado] = useState(false);

  // Carga perfil (se hace una sola vez al montar).
  useEffect(() => {
    let cancelado = false;
    void (async () => {
      try {
        if (!supabase) throw new Error('supabase no configurado');
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) throw new Error('sesión expirada');
        const v = await obtenerVendedorAdmin(token, vendedorId);
        if (!cancelado) setVendedor(v);
      } catch (err) {
        console.error('[FichaVendedor] error', err);
        if (!cancelado) setError('No pudimos cargar la ficha del vendedor');
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [vendedorId]);

  // Carga métricas cada vez que cambia el rango.
  useEffect(() => {
    let cancelado = false;
    setCargandoMetricas(true);
    void (async () => {
      try {
        if (!supabase) return;
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;
        const { desde, hasta } = derivarRango(rango);
        const m = await obtenerMetricasVendedorAdmin(token, vendedorId, {
          ...(desde ? { desde } : {}),
          ...(hasta ? { hasta } : {}),
        });
        if (!cancelado) setMetricas(m);
      } catch (err) {
        console.warn('[FichaVendedor] metrics error', err);
      } finally {
        if (!cancelado) setCargandoMetricas(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [vendedorId, rango]);

  const urlRef = useMemo(
    () => (vendedor ? `${landingUrl()}/onboarding?ref=${vendedor.codigo_corto}` : ''),
    [vendedor],
  );

  async function copiarUrl() {
    if (!urlRef) return;
    try {
      await navigator.clipboard.writeText(urlRef);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch (err) {
      console.warn('[FichaVendedor] copiar', err);
    }
  }

  return (
    <div data-entrada className="flex flex-col gap-6">
      <Button type="button" variante="secundario" tamano="sm" className="self-start" onClick={onVolver}>
        <ArrowLeft size={16} aria-hidden="true" />
        Volver
      </Button>

      {error ? (
        <p role="alert" className="rounded-card bg-danger-50 px-4 py-3 text-sm text-danger-700 ring-1 ring-danger-500/30">
          {error}
        </p>
      ) : cargando || !vendedor ? (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Skeleton className="h-80 w-full" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
          <TarjetaIdentidadVendedor vendedor={vendedor} />

          <div className="flex flex-col gap-6">
            {/* Filtros temporales */}
            <div role="group" aria-label="Rango temporal" className="flex flex-wrap gap-2">
              {OPCIONES_RANGO.map((opt) => {
                const activo = rango === opt.valor;
                return (
                  <button
                    key={opt.valor}
                    type="button"
                    onClick={() => setRango(opt.valor)}
                    aria-pressed={activo}
                    className={cn(
                      'inline-flex h-10 cursor-pointer items-center rounded-pill px-4 text-sm font-medium transition-colors',
                      activo
                        ? 'bg-marca-600 text-white shadow-suave'
                        : 'bg-white text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50',
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* 3 KPI cards */}
            <div className="grid gap-3 sm:grid-cols-3">
              <TarjetaMetrica
                titulo="Leads"
                valor={metricas?.leads}
                icono={Users}
                cargando={cargandoMetricas}
              />
              <TarjetaMetrica
                titulo="Pagos"
                valor={metricas?.pagaron}
                icono={CreditCard}
                cargando={cargandoMetricas}
              />
              <TarjetaMetrica
                titulo="Con cobertura"
                valor={metricas?.conCobertura}
                icono={ShieldCheck}
                cargando={cargandoMetricas}
              />
            </div>

            {/* Datos del vendedor */}
            <Card className="flex flex-col gap-3">
              <h2 className="text-base font-medium text-ink-900">Datos del vendedor</h2>
              <dl className="grid grid-cols-1 gap-x-6 text-sm sm:grid-cols-2">
                <FilaDato label="Nombre" valor={`${vendedor.nombre} ${vendedor.apellido}`.trim()} />
                <FilaDato label="Email" valor={vendedor.email} />
                <FilaDato label="DNI" valor={vendedor.dni ?? '—'} />
                <FilaDato label="Teléfono" valor={vendedor.telefono ?? '—'} />
                <FilaDato
                  label="Etiqueta"
                  valor={
                    vendedor.etiqueta ? (
                      <span className="inline-flex items-center rounded-pill bg-marca-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-marca-700">
                        {vendedor.etiqueta}
                      </span>
                    ) : (
                      '—'
                    )
                  }
                />
                <FilaDato label="Código corto" valor={<span className="font-mono text-xs">{vendedor.codigo_corto}</span>} />
                <div className="flex items-center justify-between gap-4 border-t border-ink-100 py-3 sm:col-span-2 sm:border-b">
                  <dt className="text-ink-500">URL de atribución</dt>
                  <dd className="flex min-w-0 items-center gap-2 text-right">
                    <span className="truncate font-mono text-xs text-ink-900">{urlRef.replace(/^https?:\/\//, '')}</span>
                    <button
                      type="button"
                      onClick={copiarUrl}
                      aria-label="Copiar URL"
                      className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-pill text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
                    >
                      {copiado ? <Check size={14} className="text-ok-700" /> : <Copy size={14} />}
                    </button>
                  </dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function TarjetaIdentidadVendedor({ vendedor }: { vendedor: VendedorAdmin }) {
  const nombreCompleto = `${vendedor.nombre} ${vendedor.apellido}`.trim();
  return (
    <section aria-label="Identidad" className="lg:sticky lg:top-20 lg:self-start">
      <Card className="flex flex-col items-center gap-4 text-center">
        <span
          aria-hidden="true"
          className="inline-flex size-24 items-center justify-center rounded-pill bg-marca-600 text-2xl font-semibold text-white shadow-suave"
        >
          {inicialesDe(vendedor.nombre, vendedor.apellido)}
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-display text-xl leading-tight text-ink-950">{nombreCompleto}</p>
          <p className="text-xs text-ink-500">{vendedor.email}</p>
        </div>
        {vendedor.etiqueta ? (
          <span className="inline-flex items-center rounded-pill bg-marca-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-marca-700">
            {vendedor.etiqueta}
          </span>
        ) : null}
        <div className="mt-2 flex w-full flex-col gap-3 border-t border-ink-100 pt-4 text-left text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-ink-500">Código</span>
            <span className="truncate font-mono text-ink-900">{vendedor.codigo_corto}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-ink-500">DNI</span>
            <span className="truncate text-ink-900">{vendedor.dni ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-ink-500">Teléfono</span>
            <span className="truncate text-ink-900">{vendedor.telefono ?? '—'}</span>
          </div>
        </div>
      </Card>
    </section>
  );
}

interface TarjetaMetricaProps {
  titulo: string;
  valor: number | undefined;
  icono: LucideIcon;
  cargando: boolean;
}

function TarjetaMetrica({ titulo, valor, icono: Glifo, cargando }: TarjetaMetricaProps) {
  return (
    <div className="flex flex-col gap-3 rounded-card bg-white p-5 shadow-card ring-1 ring-ink-100">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-600">{titulo}</p>
        <span
          aria-hidden="true"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-pill bg-marca-50 text-marca-700"
        >
          <Glifo size={16} strokeWidth={1.75} />
        </span>
      </div>
      <p className="font-display text-3xl text-ink-950">
        {cargando ? (
          <span aria-hidden="true" className="inline-block h-[1em] w-14 animate-pulse rounded-campo bg-ink-100 align-middle" />
        ) : (
          (valor?.toLocaleString('es-AR') ?? '—')
        )}
      </p>
    </div>
  );
}

function FilaDato({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-ink-100 py-3 [&:nth-last-child(-n+2)]:border-b">
      <dt className="text-ink-500">{label}</dt>
      <dd className="min-w-0 truncate text-right text-ink-900">{valor}</dd>
    </div>
  );
}
