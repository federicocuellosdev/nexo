import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, User, CreditCard, MapPin, Puzzle, Users, Compass } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Chip } from '@/ui/Chip';
import { Skeleton } from '@/ui/Skeleton';
import { Button } from '@/ui/Button';
import { supabase } from '@/lib/supabase';
import { obtenerLeadDetalle } from '@/lib/api';

export interface FichaLeadProps {
  leadId: string;
  nombre: string;
  descripcion?: string;
  /** Vuelve al listado anterior. */
  onVolver: () => void;
}

/**
 * Vista full-section de la ficha de un lead. Cada sección es una Card propia
 * (Contacto, Plan, MercadoPago, Domicilio, Trazabilidad, Integraciones,
 * Familiares) siguiendo el patrón de producción que separa "bloques"
 * visualmente. Los familiares se muestran como cards en vez de lista plana.
 */
export function FichaLead({ leadId, nombre, descripcion, onVolver }: FichaLeadProps) {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [lead, setLead] = useState<Record<string, unknown> | null>(null);
  const [beneficiarios, setBeneficiarios] = useState<Array<Record<string, unknown>>>([]);
  const [vendedor, setVendedor] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let cancelado = false;
    void (async () => {
      try {
        if (!supabase) throw new Error('supabase no configurado');
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) throw new Error('sesión expirada');
        const det = await obtenerLeadDetalle(token, leadId);
        if (cancelado) return;
        setLead(det.lead);
        setBeneficiarios(det.beneficiarios);
        setVendedor(det.vendedor);
      } catch (err) {
        console.error('[FichaLead] error', err);
        if (!cancelado) setError('No pudimos cargar la ficha.');
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [leadId]);

  return (
    <div data-entrada className="flex flex-col gap-5">
      <Button type="button" variante="secundario" tamano="sm" className="self-start" onClick={onVolver}>
        <ArrowLeft size={16} aria-hidden="true" />
        Volver
      </Button>

      <div>
        <h2 className="font-display text-2xl text-ink-950">{nombre}</h2>
        {descripcion ? <p className="mt-1 text-sm text-ink-600">{descripcion}</p> : null}
      </div>

      {error ? (
        <p role="alert" className="rounded-card bg-danger-50 px-4 py-3 text-sm text-danger-700 ring-1 ring-danger-500/30">
          {error}
        </p>
      ) : cargando ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : lead ? (
        <Bloques lead={lead} beneficiarios={beneficiarios} vendedor={vendedor} />
      ) : null}
    </div>
  );
}

// ───────────────────────────── Helpers de formato ─────────────────────────────

function formatearValor(valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return '—';
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  if (typeof valor === 'object') return JSON.stringify(valor, null, 2);
  return String(valor);
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

// ───────────────────────────── Bloques ─────────────────────────────

interface BloquesProps {
  lead: Record<string, unknown>;
  beneficiarios: Array<Record<string, unknown>>;
  vendedor: Record<string, unknown> | null;
}

function Bloques({ lead, beneficiarios, vendedor }: BloquesProps) {
  const perfil = lead.perfil && typeof lead.perfil === 'object' ? (lead.perfil as Record<string, unknown>) : null;
  const domicilio =
    perfil?.domicilio && typeof perfil.domicilio === 'object'
      ? (perfil.domicilio as Record<string, unknown>)
      : null;
  const canal = typeof lead.canal === 'string' && lead.canal ? lead.canal : null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Bloque titulo="Contacto" icono={User}>
        <Dato label="Nombre" valor={formatearValor(lead.nombre)} />
        <Dato label="Apellido" valor={formatearValor(lead.apellido)} />
        <Dato label="Email" valor={formatearValor(lead.email)} />
        <Dato label="Teléfono" valor={formatearValor(lead.telefono)} />
        <Dato label="DNI" valor={formatearValor(lead.dni)} />
        <Dato label="Fecha de nacimiento" valor={formatearFecha(lead.fecha_nacimiento, false)} />
      </Bloque>

      <Bloque titulo="Plan" icono={Puzzle}>
        <Dato label="Tipo" valor={formatearValor(lead.item_tipo)} />
        <Dato label="Plan" valor={formatearValor(lead.item_nombre)} />
        <Dato label="Slug" valor={formatearValor(lead.item_id)} />
        <Dato label="Familiares" valor={formatearValor(lead.familiares_count)} />
      </Bloque>

      <Bloque titulo="MercadoPago" icono={CreditCard}>
        <Dato
          label="Estado"
          valor={
            <Chip tono={lead.mp_status === 'authorized' ? 'ok' : 'warn'}>
              {formatearValor(lead.mp_status)}
            </Chip>
          }
        />
        <Dato label="Preapproval ID" valor={formatearValor(lead.mp_preapproval_id)} />
        <Dato label="Actualizado" valor={formatearFecha(lead.mp_updated_at)} />
      </Bloque>

      {domicilio ? (
        <Bloque titulo="Domicilio" icono={MapPin}>
          <Dato label="Calle" valor={formatearValor(domicilio.calle)} />
          <Dato label="Número" valor={formatearValor(domicilio.numero)} />
          <Dato label="Piso" valor={formatearValor(domicilio.piso)} />
          <Dato label="Departamento" valor={formatearValor(domicilio.departamento)} />
          <Dato label="Torre" valor={formatearValor(domicilio.torre)} />
          <Dato label="Localidad" valor={formatearValor(domicilio.localidad)} />
          <Dato label="Provincia" valor={formatearValor(domicilio.provincia)} />
          <Dato label="Código postal" valor={formatearValor(domicilio.cp)} />
          <Dato label="País" valor={formatearValor(domicilio.pais)} />
        </Bloque>
      ) : null}

      {/* Trazabilidad: canal + vendedor atribuido. Se muestra siempre; si
          no hay vendedor dice "Directo", si no hay canal se asume landing. */}
      <Bloque titulo="Trazabilidad" icono={Compass}>
        <Dato label="Canal" valor={canal ?? 'landing'} />
        <Dato label="Alta" valor={formatearFecha(lead.created_at)} />
        {vendedor ? (
          <>
            <Dato label="Vendedor" valor={`${formatearValor(vendedor.nombre)} ${formatearValor(vendedor.apellido)}`.trim()} />
            <Dato label="Email vendedor" valor={formatearValor(vendedor.email)} />
            <Dato label="DNI vendedor" valor={formatearValor(vendedor.dni)} />
            <Dato
              label="Etiqueta"
              valor={vendedor.etiqueta ? <Chip tono="marca">{String(vendedor.etiqueta)}</Chip> : '—'}
            />
          </>
        ) : (
          <Dato label="Vendedor" valor={<span className="text-ink-500">Sin atribución (directo)</span>} />
        )}
      </Bloque>

      <Bloque titulo="Integraciones" icono={Puzzle}>
        <Dato label="SF Lead ID" valor={formatearValor(lead.sf_lead_id)} />
        <Dato label="SF Account ID" valor={formatearValor(lead.sf_account_id)} />
        <Dato label="SF Order ID" valor={formatearValor(lead.sf_order_id)} />
        <Dato label="Magic link enviado" valor={formatearFecha(lead.magic_link_sent_at)} />
        <Dato label="Sale sent" valor={formatearFecha(lead.sale_sent_at)} />
        <Dato label="Skip SF" valor={formatearValor(lead.skip_sf)} />
        <Dato label="Activado" valor={formatearFecha(lead.activated_at)} />
      </Bloque>

      {beneficiarios.length > 0 ? (
        <div className="lg:col-span-2">
          <BloqueFamiliares beneficiarios={beneficiarios} />
        </div>
      ) : null}
    </div>
  );
}

// ───────────────────────────── Componentes de bloque ─────────────────────────────

interface BloqueProps {
  titulo: string;
  icono: LucideIcon;
  children: ReactNode;
}

function Bloque({ titulo, icono: Glifo, children }: BloqueProps) {
  return (
    <section className="rounded-card bg-white p-5 shadow-card ring-1 ring-ink-100">
      <header className="mb-4 flex items-center gap-2">
        <span aria-hidden="true" className="inline-flex size-7 items-center justify-center rounded-pill bg-marca-50 text-marca-700">
          <Glifo size={14} strokeWidth={1.75} />
        </span>
        <h3 className="text-sm font-medium uppercase tracking-wide text-ink-700">{titulo}</h3>
      </header>
      <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function Dato({ label, valor }: { label: string; valor: ReactNode }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd className="truncate text-sm text-ink-800">{valor}</dd>
    </div>
  );
}

// ───────────────────────────── Familiares (cards) ─────────────────────────────

function BloqueFamiliares({ beneficiarios }: { beneficiarios: Array<Record<string, unknown>> }) {
  return (
    <section className="rounded-card bg-white p-5 shadow-card ring-1 ring-ink-100">
      <header className="mb-4 flex items-center gap-2">
        <span aria-hidden="true" className="inline-flex size-7 items-center justify-center rounded-pill bg-marca-50 text-marca-700">
          <Users size={14} strokeWidth={1.75} />
        </span>
        <h3 className="text-sm font-medium uppercase tracking-wide text-ink-700">
          Familiares ({beneficiarios.length})
        </h3>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {beneficiarios.map((b, i) => (
          <CardFamiliar key={String(b.id ?? i)} beneficiario={b} />
        ))}
      </div>
    </section>
  );
}

function CardFamiliar({ beneficiario }: { beneficiario: Record<string, unknown> }) {
  const perfilB =
    beneficiario.perfil && typeof beneficiario.perfil === 'object'
      ? (beneficiario.perfil as Record<string, unknown>)
      : null;
  const relacion = perfilB?.relacion;
  const nombre = `${formatearValor(beneficiario.nombre)} ${formatearValor(beneficiario.apellido)}`.trim();

  return (
    <div className="flex flex-col gap-2 rounded-campo bg-ink-50 p-4 ring-1 ring-ink-100">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-medium text-ink-900">{nombre || '—'}</p>
        {relacion ? <Chip tono="marca">{String(relacion)}</Chip> : null}
      </div>
      <div className="flex flex-col gap-1 text-xs text-ink-600">
        <span>DNI {formatearValor(beneficiario.dni)}</span>
        <span>Nacimiento {formatearFecha(beneficiario.fecha_nacimiento, false)}</span>
        {beneficiario.email ? <span className="truncate">{formatearValor(beneficiario.email)}</span> : null}
      </div>
    </div>
  );
}
