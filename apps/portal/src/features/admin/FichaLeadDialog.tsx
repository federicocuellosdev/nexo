import { useEffect, useState } from 'react';
import { Dialog } from '@/ui/Dialog';
import { Skeleton } from '@/ui/Skeleton';
import { Chip } from '@/ui/Chip';
import { supabase } from '@/lib/supabase';
import { obtenerLeadDetalle } from '@/lib/api';

export interface FichaLeadDialogProps {
  leadId: string;
  /** Título mostrado (nombre completo del lead desde la tabla). */
  nombre: string;
  /** Subtítulo contextual (email o estado). */
  descripcion?: string;
  onCerrar: () => void;
}

/**
 * Dialog con la ficha completa de un lead (titular). Trae todos los campos
 * de v3.leads + lista de beneficiarios asociados. Se usa desde la sección
 * Negocio tanto para la tabla Afiliados como para la tabla Leads — el
 * contenido es el mismo, solo cambia desde dónde se abre.
 */
export function FichaLeadDialog({ leadId, nombre, descripcion, onCerrar }: FichaLeadDialogProps) {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [lead, setLead] = useState<Record<string, unknown> | null>(null);
  const [beneficiarios, setBeneficiarios] = useState<Array<Record<string, unknown>>>([]);

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
      } catch (err) {
        console.error('[FichaLeadDialog] error', err);
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
    <Dialog
      abierto
      onCambio={(abierto) => {
        if (!abierto) onCerrar();
      }}
      titulo={nombre}
      descripcion={descripcion}
    >
      {cargando ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      ) : error ? (
        <p role="alert" className="rounded-card bg-danger-50 px-4 py-3 text-sm text-danger-700 ring-1 ring-danger-500/30">
          {error}
        </p>
      ) : lead ? (
        <FichaContenido lead={lead} beneficiarios={beneficiarios} />
      ) : null}
    </Dialog>
  );
}

function formatearValor(valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return '—';
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  if (typeof valor === 'object') return JSON.stringify(valor, null, 2);
  return String(valor);
}

function formatearFecha(iso: unknown): string {
  if (typeof iso !== 'string' || !iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

interface FichaContenidoProps {
  lead: Record<string, unknown>;
  beneficiarios: Array<Record<string, unknown>>;
}

/**
 * Agrupa los campos de v3.leads por sección (Contacto, Plan, MP, Perfil,
 * Integraciones) para que la ficha se lea como una historia en vez de
 * una lista plana de 30 columnas.
 */
function FichaContenido({ lead, beneficiarios }: FichaContenidoProps) {
  const perfil = lead.perfil && typeof lead.perfil === 'object' ? (lead.perfil as Record<string, unknown>) : null;
  const domicilio =
    perfil?.domicilio && typeof perfil.domicilio === 'object'
      ? (perfil.domicilio as Record<string, unknown>)
      : null;

  return (
    <div className="flex flex-col gap-5">
      <Seccion titulo="Contacto">
        <Dato label="Nombre" valor={formatearValor(lead.nombre)} />
        <Dato label="Apellido" valor={formatearValor(lead.apellido)} />
        <Dato label="Email" valor={formatearValor(lead.email)} />
        <Dato label="Teléfono" valor={formatearValor(lead.telefono)} />
        <Dato label="DNI" valor={formatearValor(lead.dni)} />
        <Dato label="Fecha de nacimiento" valor={formatearValor(lead.fecha_nacimiento)} />
      </Seccion>

      <Seccion titulo="Plan">
        <Dato label="Tipo" valor={formatearValor(lead.item_tipo)} />
        <Dato label="Plan" valor={formatearValor(lead.item_nombre)} />
        <Dato label="Slug" valor={formatearValor(lead.item_id)} />
        <Dato label="Familiares" valor={formatearValor(lead.familiares_count)} />
      </Seccion>

      <Seccion titulo="MercadoPago">
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
      </Seccion>

      {domicilio ? (
        <Seccion titulo="Domicilio">
          <Dato label="Calle" valor={formatearValor(domicilio.calle)} />
          <Dato label="Número" valor={formatearValor(domicilio.numero)} />
          <Dato label="Piso" valor={formatearValor(domicilio.piso)} />
          <Dato label="Departamento" valor={formatearValor(domicilio.departamento)} />
          <Dato label="Torre" valor={formatearValor(domicilio.torre)} />
          <Dato label="Localidad" valor={formatearValor(domicilio.localidad)} />
          <Dato label="Provincia" valor={formatearValor(domicilio.provincia)} />
          <Dato label="Código postal" valor={formatearValor(domicilio.cp)} />
          <Dato label="País" valor={formatearValor(domicilio.pais)} />
        </Seccion>
      ) : null}

      <Seccion titulo="Integraciones">
        <Dato label="SF Lead ID" valor={formatearValor(lead.sf_lead_id)} />
        <Dato label="SF Account ID" valor={formatearValor(lead.sf_account_id)} />
        <Dato label="SF Order ID" valor={formatearValor(lead.sf_order_id)} />
        <Dato label="Magic link enviado" valor={formatearFecha(lead.magic_link_sent_at)} />
        <Dato label="Sale sent" valor={formatearFecha(lead.sale_sent_at)} />
        <Dato label="Skip SF" valor={formatearValor(lead.skip_sf)} />
        <Dato label="Alta" valor={formatearFecha(lead.created_at)} />
        <Dato label="Activado" valor={formatearFecha(lead.activated_at)} />
      </Seccion>

      {beneficiarios.length > 0 ? (
        <Seccion titulo={`Beneficiarios (${beneficiarios.length})`}>
          <div className="col-span-full flex flex-col gap-3">
            {beneficiarios.map((b, i) => {
              const perfilB =
                b.perfil && typeof b.perfil === 'object' ? (b.perfil as Record<string, unknown>) : null;
              return (
                <div key={String(b.id ?? i)} className="rounded-campo bg-ink-50 p-3">
                  <p className="text-sm font-medium text-ink-900">
                    {formatearValor(b.nombre)} {formatearValor(b.apellido)}
                  </p>
                  <p className="text-xs text-ink-600">
                    DNI {formatearValor(b.dni)} · Nac.{' '}
                    {formatearValor(b.fecha_nacimiento)}
                    {perfilB?.relacion ? ` · ${String(perfilB.relacion)}` : ''}
                  </p>
                </div>
              );
            })}
          </div>
        </Seccion>
      ) : null}
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-500">{titulo}</h3>
      <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function Dato({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd className="truncate text-sm text-ink-800">{valor}</dd>
    </div>
  );
}
