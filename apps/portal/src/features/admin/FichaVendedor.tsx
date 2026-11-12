import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Users, CreditCard, ShieldCheck, Copy, Check, Pencil, ChevronRight, Mail } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { supabase } from '@/lib/supabase';
import { landingUrl } from '@/lib/urls';
import {
  obtenerVendedorAdmin,
  obtenerMetricasVendedorAdmin,
  reenviarEmailVendedor,
  type VendedorAdmin,
  type MetricasAdmin,
} from '@/lib/api';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Skeleton } from '@/ui/Skeleton';
import { EditarVendedorDialog } from '@/features/admin/EditarVendedorDialog';

type Rango = '7' | '14' | '30' | 'mes' | 'personalizado' | 'todo';

const OPCIONES_RANGO: Array<{ valor: Rango; label: string }> = [
  { valor: 'mes', label: 'Este mes' },
  { valor: '7', label: '7 días' },
  { valor: '14', label: '14 días' },
  { valor: '30', label: '30 días' },
  { valor: 'personalizado', label: 'Personalizado' },
  { valor: 'todo', label: 'Todo' },
];

function isoAStart(iso: string): string | null {
  if (!iso) return null;
  const t = new Date(`${iso}T00:00:00`);
  return Number.isNaN(t.getTime()) ? null : t.toISOString();
}
function isoAEnd(iso: string): string | null {
  if (!iso) return null;
  const t = new Date(`${iso}T23:59:59.999`);
  return Number.isNaN(t.getTime()) ? null : t.toISOString();
}

/** Deriva `{desde, hasta}` ISO strings del rango seleccionado para pasar
 *  como query al endpoint de métricas. `null` significa "sin cota". */
function derivarRango(
  rango: Rango,
  desdeCustom: string,
  hastaCustom: string,
): { desde: string | null; hasta: string | null } {
  if (rango === 'todo') return { desde: null, hasta: null };
  if (rango === 'personalizado') {
    return { desde: isoAStart(desdeCustom), hasta: isoAEnd(hastaCustom) };
  }
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
  const [desdeCustom, setDesdeCustom] = useState('');
  const [hastaCustom, setHastaCustom] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [editando, setEditando] = useState(false);
  // 'idle' | 'enviando' | 'ok' | 'error'. 'ok' se auto-vuelve a 'idle' tras 2.5s
  // para que el usuario vea el check de confirmación sin dejar el botón bloqueado.
  const [estadoReenvio, setEstadoReenvio] = useState<'idle' | 'enviando' | 'ok' | 'error'>('idle');

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
        const { desde, hasta } = derivarRango(rango, desdeCustom, hastaCustom);
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
  }, [vendedorId, rango, desdeCustom, hastaCustom]);

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

  async function reenviar() {
    if (estadoReenvio === 'enviando' || !vendedor) return;
    setEstadoReenvio('enviando');
    try {
      if (!supabase) throw new Error('supabase no configurado');
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('sesión expirada');
      await reenviarEmailVendedor(token, vendedor.id);
      setEstadoReenvio('ok');
      setTimeout(() => setEstadoReenvio('idle'), 2500);
    } catch (err) {
      console.error('[FichaVendedor] reenviar email', err);
      setEstadoReenvio('error');
      setTimeout(() => setEstadoReenvio('idle'), 2500);
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
          <div className="flex flex-col gap-3 lg:sticky lg:top-20 lg:self-start">
            <TarjetaIdentidadVendedor vendedor={vendedor} />
            {/* Acciones de la ficha: editar perfil + reenviar email con datos
                + magic link. Van acá debajo (y no en el top de la columna
                derecha) para que queden pegadas al bloque de identidad del
                vendedor sobre el que operan. */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variante="secundario"
                tamano="sm"
                onClick={() => setEditando(true)}
                className="justify-center"
              >
                <Pencil size={14} aria-hidden="true" />
                Editar perfil
              </Button>
              <Button
                type="button"
                variante="secundario"
                tamano="sm"
                onClick={reenviar}
                disabled={estadoReenvio === 'enviando'}
                className="justify-center"
              >
                {estadoReenvio === 'ok' ? (
                  <>
                    <Check size={14} aria-hidden="true" className="text-ok-700" />
                    Enviado
                  </>
                ) : estadoReenvio === 'error' ? (
                  'Reintentar'
                ) : (
                  <>
                    <Mail size={14} aria-hidden="true" />
                    {estadoReenvio === 'enviando' ? 'Enviando…' : 'Reenviar email'}
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* Filtros temporales full-width. */}
            <div className="flex w-full items-center gap-3">
              <div role="group" aria-label="Rango temporal" className="flex flex-1 flex-wrap gap-2">
                {OPCIONES_RANGO.map((opt) => {
                  const activo = rango === opt.valor;
                  return (
                    <button
                      key={opt.valor}
                      type="button"
                      onClick={() => setRango(opt.valor)}
                      aria-pressed={activo}
                      className={cn(
                        'inline-flex h-10 flex-1 cursor-pointer items-center justify-center rounded-pill px-4 text-sm font-medium transition-colors whitespace-nowrap',
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
            </div>

            {rango === 'personalizado' ? (
              <div className="grid gap-3 rounded-card bg-marca-50/50 p-4 ring-1 ring-marca-100 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-marca-700">
                  Desde
                  <input
                    type="date"
                    value={desdeCustom}
                    max={hastaCustom || undefined}
                    onChange={(e) => setDesdeCustom(e.target.value)}
                    className="rounded-pill bg-white px-3 py-2 text-sm text-ink-900 ring-1 ring-ink-200 focus:outline-none focus:ring-marca-400"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-marca-700">
                  Hasta
                  <input
                    type="date"
                    value={hastaCustom}
                    min={desdeCustom || undefined}
                    onChange={(e) => setHastaCustom(e.target.value)}
                    className="rounded-pill bg-white px-3 py-2 text-sm text-ink-900 ring-1 ring-ink-200 focus:outline-none focus:ring-marca-400"
                  />
                </label>
              </div>
            ) : null}

            {/* 3 KPI cards con chevrons entre ellas indicando el flujo. En
                mobile se apilan y la chevron rota 90° para seguir leyendo
                como progresion vertical. */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <TarjetaMetrica titulo="Leads" valor={metricas?.leads} icono={Users} cargando={cargandoMetricas} />
              </div>
              <ChevronRight
                size={24}
                aria-hidden="true"
                className="mx-auto shrink-0 rotate-90 text-ink-300 sm:rotate-0"
              />
              <div className="flex-1">
                <TarjetaMetrica titulo="Pagos" valor={metricas?.pagaron} icono={CreditCard} cargando={cargandoMetricas} />
              </div>
              <ChevronRight
                size={24}
                aria-hidden="true"
                className="mx-auto shrink-0 rotate-90 text-ink-300 sm:rotate-0"
              />
              <div className="flex-1">
                <TarjetaMetrica
                  titulo="Con cobertura"
                  valor={metricas?.conCobertura}
                  icono={ShieldCheck}
                  cargando={cargandoMetricas}
                />
              </div>
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

      {editando && vendedor ? (
        <EditarVendedorDialog
          vendedor={vendedor}
          onCerrar={() => setEditando(false)}
          onGuardado={() => {
            setEditando(false);
            // Re-fetch del perfil para refrescar los campos editados.
            void (async () => {
              if (!supabase) return;
              const { data } = await supabase.auth.getSession();
              const token = data.session?.access_token;
              if (!token) return;
              try {
                const v = await obtenerVendedorAdmin(token, vendedorId);
                setVendedor(v);
              } catch (err) {
                console.warn('[FichaVendedor] refetch error', err);
              }
            })();
          }}
        />
      ) : null}
    </div>
  );
}

function TarjetaIdentidadVendedor({ vendedor }: { vendedor: VendedorAdmin }) {
  const nombreCompleto = `${vendedor.nombre} ${vendedor.apellido}`.trim();
  return (
    <section aria-label="Identidad">
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
      <div className="flex items-center justify-between gap-3">
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
