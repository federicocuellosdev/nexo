import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
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
 * Vista full-section de la ficha de un lead (titular). Reemplaza al
 * dialog: ocupa el espacio del listado de Negocio, con un botón "Volver"
 * arriba para regresar a la tabla. Trae todos los campos de v3.leads
 * agrupados por sección + beneficiarios asociados.
 */
export function FichaLead({ leadId, nombre, descripcion, onVolver }: FichaLeadProps) {
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

      <div className="rounded-card bg-white p-6 shadow-card ring-1 ring-ink-100">
        {cargando ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : error ? (
          <p role="alert" className="text-sm text-danger-700">
            {error}
          </p>
        ) : lead ? (
          <FichaContenido lead={lead} beneficiarios={beneficiarios} />
        ) : null}
      </div>
    </div>
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

function FichaContenido({ lead, beneficiarios }: FichaContenidoProps) {
  const perfil = lead.perfil && typeof lead.perfil === 'object' ? (lead.perfil as Record<string, unknown>) : null;
  const domicilio =
    perfil?.domicilio && typeof perfil.domicilio === 'object'
      ? (perfil.domicilio as Record<string, unknown>)
      : null;

  return (
    <div className="flex flex-col gap-6">
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
              const perfilB = b.perfil && typeof b.perfil === 'object' ? (b.perfil as Record<string, unknown>) : null;
              return (
                <div key={String(b.id ?? i)} className="rounded-campo bg-ink-50 p-3">
                  <p className="text-sm font-medium text-ink-900">
                    {formatearValor(b.nombre)} {formatearValor(b.apellido)}
                  </p>
                  <p className="text-xs text-ink-600">
                    DNI {formatearValor(b.dni)} · Nac. {formatearValor(b.fecha_nacimiento)}
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
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-500">{titulo}</h3>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>
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
