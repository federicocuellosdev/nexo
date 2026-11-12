import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { obtenerBeneficiarioAdmin } from '@/lib/api';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { Skeleton } from '@/ui/Skeleton';

export interface FichaFamiliarProps {
  beneficiarioId: string;
  /** Vuelve a la ficha del titular (normal: clickear "Volver" desde la
   *  ficha del familiar lleva de vuelta a la vista anterior). */
  onVolver: () => void;
  /** Click en el chip del titular → navega a su ficha. */
  onVerTitular?: (titularId: string) => void;
}

/**
 * Ficha de un beneficiario (familiar). Mismo layout 2 columnas que
 * FichaLead pero con menos secciones: Contacto, Vínculo, Suscripción
 * compartida. Sin bloque MP (el beneficiario no paga, hereda la
 * suscripción del titular), sin Salesforce (idem), sin Trazabilidad
 * (idem canal + vendedor del titular). La relación con el titular está
 * siempre destacada arriba.
 */
export function FichaFamiliar({ beneficiarioId, onVolver, onVerTitular }: FichaFamiliarProps) {
  const [beneficiario, setBeneficiario] = useState<Record<string, unknown> | null>(null);
  const [titular, setTitular] = useState<Record<string, unknown> | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelado = false;
    void (async () => {
      try {
        if (!supabase) throw new Error('supabase no configurado');
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) throw new Error('sesión expirada');
        const det = await obtenerBeneficiarioAdmin(token, beneficiarioId);
        if (cancelado) return;
        setBeneficiario(det.beneficiario);
        setTitular(det.titular);
      } catch (err) {
        console.error('[FichaFamiliar] error', err);
        if (!cancelado) setError('No pudimos cargar la ficha.');
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [beneficiarioId]);

  const nombre = beneficiario ? `${str(beneficiario.nombre) ?? ''} ${str(beneficiario.apellido) ?? ''}`.trim() : '';
  const email = beneficiario ? str(beneficiario.email) ?? '' : '';

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
      ) : cargando || !beneficiario ? (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Skeleton className="h-80 w-full" />
          <div className="flex flex-col gap-4">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
          <TarjetaIdentidad
            nombre={nombre}
            email={email}
            titular={titular}
            onVerTitular={onVerTitular}
          />

          <div className="flex flex-col gap-6">
            <Seccion titulo="Contacto">
              <Dato etiqueta="Nombre" valor={formatearValor(beneficiario.nombre)} />
              <Dato etiqueta="Apellido" valor={formatearValor(beneficiario.apellido)} />
              <Dato etiqueta="Email" valor={formatearValor(beneficiario.email)} />
              <Dato etiqueta="Teléfono" valor={formatearValor(beneficiario.telefono)} />
              <Dato etiqueta="DNI" valor={formatearValor(beneficiario.dni)} />
              <Dato etiqueta="Fecha de nacimiento" valor={formatearFecha(beneficiario.fecha_nacimiento, false)} />
            </Seccion>

            {titular ? (
              <Seccion titulo="Suscripción (heredada del titular)">
                <Dato
                  etiqueta="Estado MP"
                  valor={
                    <Chip tono={titular.mp_status === 'authorized' ? 'ok' : 'warn'}>
                      {formatearValor(titular.mp_status)}
                    </Chip>
                  }
                />
                <Dato etiqueta="Canal" valor={<Chip tono="marca">{formatearValor(titular.canal) ?? 'landing'}</Chip>} />
                <Dato etiqueta="Alta" valor={formatearFecha(titular.created_at)} />
                <Dato etiqueta="Email titular" valor={formatearValor(titular.email)} />
                <Dato
                  etiqueta="ID de suscripción"
                  valor={<span className="font-mono text-xs">{formatearValor(titular.mp_preapproval_id)}</span>}
                  ancho="completo"
                />
              </Seccion>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────── helpers ─────────────

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function formatearValor(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Sí' : 'No';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function formatearFecha(iso: unknown, incluirHora = true): string {
  if (typeof iso !== 'string' || !iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      ...(incluirHora ? { hour: '2-digit', minute: '2-digit' } : {}),
    });
  } catch {
    return iso;
  }
}

function inicialesDe(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  const iniciales = partes.slice(0, 2).map((p) => p.charAt(0)).join('');
  return iniciales ? iniciales.toUpperCase() : '—';
}

// ───────────── Identidad (columna izquierda) ─────────────

function TarjetaIdentidad({
  nombre,
  email,
  titular,
  onVerTitular,
}: {
  nombre: string;
  email: string;
  titular: Record<string, unknown> | null;
  onVerTitular?: (titularId: string) => void;
}) {
  return (
    <section
      aria-label="Identidad"
      className="lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:self-start lg:overflow-y-auto"
    >
      <Card className="flex flex-col items-center gap-4 text-center">
        <span
          aria-hidden="true"
          className="inline-flex size-24 items-center justify-center rounded-pill bg-marca-600 text-2xl font-semibold text-white shadow-suave"
        >
          {inicialesDe(nombre || email)}
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-display text-xl leading-tight text-ink-950">{nombre || '—'}</p>
          {email ? <p className="text-xs text-ink-500">{email}</p> : null}
        </div>
        {titular ? (
          <div className="mt-2 flex w-full flex-col gap-2 border-t border-ink-100 pt-4 text-left">
            <p className="text-[10px] font-medium uppercase tracking-wide text-ink-500">Titular</p>
            <p className="truncate text-sm font-medium text-ink-900">
              {`${formatearValor(titular.nombre)} ${formatearValor(titular.apellido)}`.trim()}
            </p>
            <button
              type="button"
              onClick={() => {
                if (typeof titular.id === 'string') onVerTitular?.(titular.id);
              }}
              className="self-start cursor-pointer text-xs font-medium text-marca-700 underline-offset-2 hover:underline"
            >
              Ver ficha del titular →
            </button>
          </div>
        ) : null}
      </Card>
    </section>
  );
}

// ───────────── Seccion / Dato (replicados de FichaLead) ─────────────

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section aria-label={titulo}>
      <Card className="flex flex-col gap-3">
        <h2 className="text-base font-medium text-ink-900">{titulo}</h2>
        <dl className="grid grid-cols-1 gap-x-6 text-sm sm:grid-cols-2">{children}</dl>
      </Card>
    </section>
  );
}

function Dato({
  etiqueta,
  valor,
  ancho = 'medio',
}: {
  etiqueta: string;
  valor: ReactNode;
  ancho?: 'medio' | 'completo';
}) {
  const completo = ancho === 'completo';
  return (
    <div
      className={[
        'flex items-center justify-between gap-4 border-t border-ink-100 py-3',
        completo ? 'sm:col-span-2 sm:border-b' : '[&:nth-last-child(-n+2)]:border-b',
      ].join(' ')}
    >
      <dt className="text-ink-500">{etiqueta}</dt>
      <dd className="min-w-0 text-right text-ink-900">
        <span className={completo ? 'block break-all' : 'block truncate'}>{valor}</span>
      </dd>
    </div>
  );
}
