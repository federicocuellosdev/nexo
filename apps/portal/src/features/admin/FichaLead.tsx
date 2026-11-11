import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Chip } from '@/ui/Chip';
import { Skeleton } from '@/ui/Skeleton';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { supabase } from '@/lib/supabase';
import { obtenerLeadDetalle } from '@/lib/api';
import { buscarPlan } from '@/mock/planes';

/**
 * Mapeo slug local → offerCode SF. Hoy los tres slugs resuelven al mismo
 * XTEFO; si se diferencian en el futuro, agregar la entrada. Duplica la
 * tabla del backend (sf/saleIntakeTrigger.ts) para no tener que pedirla:
 * son ~3 líneas y cambian muy poco.
 */
const SLUG_A_OFFER_CODE: Record<string, string> = {
  'nexo-1': 'XTEFO',
  'nexo-2': 'XTEFO',
  'nexo-3': 'XTEFO',
};

/**
 * Códigos técnicos de cada prestación. No vienen de SF (hoy SF no expone
 * IDs por cobertura individual al frontend); los armamos acá de forma
 * estable para que el admin tenga algo accionable al pedir soporte.
 * Formato: <SLUG_PLAN>-<CODIGO_PRESTACION>.
 */
const CODIGO_PRESTACION: Record<string, string> = {
  'Médico Clínico': 'MC',
  'Psicología': 'PSI',
  'Emergencias médicas': 'EMG',
  'Guardia odontológica': 'ODT',
  'Descuentos en farmacias': 'FAR',
};

export interface FichaLeadProps {
  leadId: string;
  nombre: string;
  descripcion?: string;
  /** Vuelve al listado anterior. */
  onVolver: () => void;
}

/**
 * Vista full-section de la ficha de un lead. Layout de dos columnas estilo
 * Cuenta.tsx: tarjeta de identidad sticky a la izquierda con avatar + estado
 * de cobertura, y a la derecha secciones apiladas (Contacto, Plan, MP,
 * Domicilio, Trazabilidad, Integraciones, Familiares).
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
    <div data-entrada className="flex flex-col gap-6">
      <Button type="button" variante="secundario" tamano="sm" className="self-start" onClick={onVolver}>
        <ArrowLeft size={16} aria-hidden="true" />
        Volver
      </Button>

      {error ? (
        <p role="alert" className="rounded-card bg-danger-50 px-4 py-3 text-sm text-danger-700 ring-1 ring-danger-500/30">
          {error}
        </p>
      ) : cargando ? (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Skeleton className="h-80 w-full" />
          <div className="flex flex-col gap-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      ) : lead ? (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
          <TarjetaIdentidad lead={lead} fallbackNombre={nombre} fallbackEmail={descripcion} />
          <ColumnaDatos lead={lead} beneficiarios={beneficiarios} vendedor={vendedor} />
        </div>
      ) : null}
    </div>
  );
}

// ───────────────────────────── Helpers ─────────────────────────────

function str(valor: unknown): string | undefined {
  return typeof valor === 'string' && valor.length > 0 ? valor : undefined;
}

function formatearValor(valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return '—';
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  if (typeof valor === 'object') return JSON.stringify(valor);
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

function inicialesDe(nombre: string, apellido: string, email?: string): string {
  const n = nombre.trim();
  const a = apellido.trim();
  const partes = `${n.charAt(0)}${a.charAt(0)}`.trim();
  if (partes) return partes.toUpperCase();
  const local = (email ?? '').split('@')[0] ?? '';
  return (local.charAt(0) || '—').toUpperCase();
}

// ───────────────────────────── Columna izquierda ─────────────────────────────

interface TarjetaIdentidadProps {
  lead: Record<string, unknown>;
  fallbackNombre: string;
  fallbackEmail?: string;
}

/**
 * Card sticky a la izquierda con la identidad del lead: avatar con iniciales,
 * nombre, email y chip de estado de cobertura. Es la "info principal" que
 * siempre está a la vista mientras se scrollea el resto.
 */
function TarjetaIdentidad({ lead, fallbackNombre, fallbackEmail }: TarjetaIdentidadProps) {
  const nombre = str(lead.nombre) ?? '';
  const apellido = str(lead.apellido) ?? '';
  const email = str(lead.email) ?? fallbackEmail ?? '';
  const nombreCompleto = `${nombre} ${apellido}`.trim() || fallbackNombre;
  const tieneDni = Boolean(str(lead.dni));
  const tieneFechaNac = Boolean(str(lead.fecha_nacimiento));
  const perfilCompleto = tieneDni && tieneFechaNac;
  const estadoMp = str(lead.mp_status);
  const conCobertura = estadoMp === 'authorized' && perfilCompleto;

  const chip = conCobertura
    ? { tono: 'ok' as const, texto: 'Con cobertura' }
    : estadoMp === 'authorized'
      ? { tono: 'warn' as const, texto: 'Pagó · falta perfil' }
      : estadoMp
        ? { tono: 'neutro' as const, texto: estadoMp }
        : { tono: 'neutro' as const, texto: 'Sin pagar' };

  return (
    <section
      aria-label="Identidad"
      className="lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:self-start lg:overflow-y-auto"
    >
      <Card className="flex flex-col items-center gap-4 text-center">
        <span
          aria-hidden="true"
          className="inline-flex size-24 items-center justify-center rounded-pill bg-marca-600 text-2xl font-semibold text-white shadow-suave"
        >
          {inicialesDe(nombre, apellido, email)}
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-display text-xl leading-tight text-ink-950">{nombreCompleto}</p>
          {email ? <p className="text-xs text-ink-500">{email}</p> : null}
        </div>

        <Chip tono={chip.tono}>{chip.texto}</Chip>

        <div className="mt-2 flex w-full flex-col gap-3 border-t border-ink-100 pt-4 text-left text-sm">
          <FilaResumen etiqueta="Plan" valor={str(lead.item_nombre) ?? '—'} />
          <FilaResumen etiqueta="DNI" valor={str(lead.dni) ?? '—'} />
          <FilaResumen etiqueta="Teléfono" valor={str(lead.telefono) ?? '—'} />
          <FilaResumen etiqueta="Alta" valor={formatearFecha(lead.created_at, false)} />
        </div>
      </Card>
    </section>
  );
}

function FilaResumen({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ink-500">{etiqueta}</span>
      <span className="truncate text-right text-ink-900">{valor}</span>
    </div>
  );
}

// ───────────────────────────── Columna derecha ─────────────────────────────

interface ColumnaDatosProps {
  lead: Record<string, unknown>;
  beneficiarios: Array<Record<string, unknown>>;
  vendedor: Record<string, unknown> | null;
}

function ColumnaDatos({ lead, beneficiarios, vendedor }: ColumnaDatosProps) {
  const perfil = lead.perfil && typeof lead.perfil === 'object' ? (lead.perfil as Record<string, unknown>) : null;
  const domicilio =
    perfil?.domicilio && typeof perfil.domicilio === 'object'
      ? (perfil.domicilio as Record<string, unknown>)
      : null;
  const canal = str(lead.canal) ?? 'landing';

  const familiaresCount = useMemo(() => beneficiarios.length, [beneficiarios]);

  return (
    <div className="flex flex-col gap-6">
      <Seccion titulo="Contacto">
        <Dato etiqueta="Nombre" valor={formatearValor(lead.nombre)} />
        <Dato etiqueta="Apellido" valor={formatearValor(lead.apellido)} />
        <Dato etiqueta="Email" valor={formatearValor(lead.email)} />
        <Dato etiqueta="Teléfono" valor={formatearValor(lead.telefono)} />
        <Dato etiqueta="DNI" valor={formatearValor(lead.dni)} />
        <Dato etiqueta="Fecha de nacimiento" valor={formatearFecha(lead.fecha_nacimiento, false)} />
      </Seccion>

      <Seccion titulo="Plan">
        <Dato etiqueta="Plan" valor={formatearValor(lead.item_nombre)} />
        <Dato etiqueta="Familiares declarados" valor={formatearValor(lead.familiares_count)} />
        <Dato
          etiqueta="Offer code SF"
          valor={
            <span className="font-mono text-xs">
              {typeof lead.item_id === 'string' ? (SLUG_A_OFFER_CODE[lead.item_id] ?? '—') : '—'}
            </span>
          }
          ancho="completo"
        />
      </Seccion>

      <TablaCobertura slugPlan={typeof lead.item_id === 'string' ? lead.item_id : undefined} />

      <Seccion titulo="MercadoPago">
        <Dato
          etiqueta="Estado"
          valor={
            <Chip tono={lead.mp_status === 'authorized' ? 'ok' : 'warn'}>
              {formatearValor(lead.mp_status)}
            </Chip>
          }
        />
        <Dato etiqueta="Actualizado" valor={formatearFecha(lead.mp_updated_at)} />
        <Dato
          etiqueta="ID de suscripción"
          valor={<span className="font-mono text-xs">{formatearValor(lead.mp_preapproval_id)}</span>}
          ancho="completo"
        />
      </Seccion>

      {domicilio ? (
        <Seccion titulo="Domicilio">
          <Dato etiqueta="Calle" valor={formatearValor(domicilio.calle)} />
          <Dato etiqueta="Número" valor={formatearValor(domicilio.numero)} />
          <Dato etiqueta="Piso" valor={formatearValor(domicilio.piso)} />
          <Dato etiqueta="Departamento" valor={formatearValor(domicilio.departamento)} />
          <Dato etiqueta="Torre" valor={formatearValor(domicilio.torre)} />
          <Dato etiqueta="Localidad" valor={formatearValor(domicilio.localidad)} />
          <Dato etiqueta="Provincia" valor={formatearValor(domicilio.provincia)} />
          <Dato etiqueta="Código postal" valor={formatearValor(domicilio.cp)} />
          <Dato etiqueta="País" valor={formatearValor(domicilio.pais)} />
        </Seccion>
      ) : null}

      <Seccion titulo="Trazabilidad">
        <Dato etiqueta="Canal" valor={canal} />
        <Dato etiqueta="Alta" valor={formatearFecha(lead.created_at)} />
        {vendedor ? (
          <>
            <Dato
              etiqueta="Vendedor"
              valor={`${formatearValor(vendedor.nombre)} ${formatearValor(vendedor.apellido)}`.trim()}
            />
            <Dato etiqueta="Email vendedor" valor={formatearValor(vendedor.email)} />
            <Dato etiqueta="DNI vendedor" valor={formatearValor(vendedor.dni)} />
            <Dato
              etiqueta="Etiqueta"
              valor={vendedor.etiqueta ? <Chip tono="marca">{String(vendedor.etiqueta)}</Chip> : '—'}
            />
          </>
        ) : (
          <Dato etiqueta="Vendedor" valor={<span className="text-ink-500">Sin atribución (directo)</span>} />
        )}
      </Seccion>

      <Seccion titulo="Integraciones">
        <Dato etiqueta="SF Lead ID" valor={formatearValor(lead.sf_lead_id)} />
        <Dato etiqueta="SF Account ID" valor={formatearValor(lead.sf_account_id)} />
        <Dato etiqueta="SF Order ID" valor={formatearValor(lead.sf_order_id)} />
        <Dato etiqueta="Magic link enviado" valor={formatearFecha(lead.magic_link_sent_at)} />
        <Dato etiqueta="Sale sent" valor={formatearFecha(lead.sale_sent_at)} />
        <Dato etiqueta="Skip SF" valor={formatearValor(lead.skip_sf)} />
        <Dato etiqueta="Activado" valor={formatearFecha(lead.activated_at)} />
      </Seccion>

      {familiaresCount > 0 ? <SeccionFamiliares beneficiarios={beneficiarios} /> : null}
    </div>
  );
}

// ───────────────────────────── Primitivos Seccion / Dato ─────────────────────────────

/**
 * Bloque titulado estilo Cuenta.tsx: título a la izquierda, fila de datos
 * abajo con `<dl>` responsive a 2 columnas. Sin ícono porque el bloque ya
 * se identifica por el título y la columna de identidad lleva la jerarquía
 * visual.
 */
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

/**
 * Fila etiqueta/valor con border-t tope y border-b en las últimas dos filas
 * para cerrar el bloque (grid 2-col). Mismo patrón que Cuenta.tsx.
 *
 * `ancho="completo"` fuerza col-span-2 — útil para valores largos (hashes,
 * IDs externos) que se cortarían con truncate en una columna sola. Como
 * atraviesa todo el ancho, no truncamos: dejamos que el valor rompa línea
 * con break-all para mantenerlo legible.
 */
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
        'flex justify-between gap-4 border-t border-ink-100 py-3',
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

// ───────────────────────────── Cobertura ─────────────────────────────

/**
 * Tabla de prestaciones del plan. Lee el catálogo estático de `mock/planes.ts`
 * (la fuente comercial) y arma una fila por cada prestación con su código,
 * estado y detalle. Si el slug del lead no matchea ningún plan registrado,
 * renderiza una Card vacía con mensaje.
 */
function TablaCobertura({ slugPlan }: { slugPlan: string | undefined }) {
  const plan = slugPlan ? buscarPlan(slugPlan) : undefined;

  return (
    <section aria-label="Cobertura">
      <Card className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base font-medium text-ink-900">Cobertura</h2>
          {plan ? (
            <span className="text-xs text-ink-500">{plan.prestaciones.length} prestaciones</span>
          ) : null}
        </div>
        {plan ? (
          <div className="-mx-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-y border-ink-100 text-xs font-medium uppercase tracking-wide text-ink-500">
                <tr>
                  <th scope="col" className="px-5 py-2">Código</th>
                  <th scope="col" className="px-5 py-2">Prestación</th>
                  <th scope="col" className="px-5 py-2">Estado</th>
                  <th scope="col" className="px-5 py-2">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {plan.prestaciones.map((p) => {
                  const codigoCorto = CODIGO_PRESTACION[p.label] ?? 'OTR';
                  const codigo = `${plan.slug.toUpperCase().replace('-', '')}-${codigoCorto}`;
                  const tonoChip =
                    p.estado === 'incluido' ? 'ok' : p.estado === 'coseguro' ? 'warn' : 'neutro';
                  const textoEstado =
                    p.estado === 'incluido'
                      ? 'Incluido'
                      : p.estado === 'coseguro'
                        ? 'Coseguro'
                        : 'No incluido';
                  return (
                    <tr key={codigo}>
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-ink-700">{codigo}</td>
                      <td className="px-5 py-3 text-ink-900">
                        {p.label}
                        {p.pendiente ? (
                          <span className="ml-2 inline-flex items-center rounded-pill bg-warn-50 px-2 py-0.5 text-[10px] font-medium text-warn-700">
                            a confirmar
                          </span>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <Chip tono={tonoChip}>{textoEstado}</Chip>
                      </td>
                      <td className="px-5 py-3 text-ink-700">{p.detalle ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-ink-500">Sin catálogo para este plan.</p>
        )}
      </Card>
    </section>
  );
}

// ───────────────────────────── Familiares ─────────────────────────────

function SeccionFamiliares({ beneficiarios }: { beneficiarios: Array<Record<string, unknown>> }) {
  return (
    <section aria-label="Familiares">
      <Card className="flex flex-col gap-3">
        <h2 className="text-base font-medium text-ink-900">Familiares ({beneficiarios.length})</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {beneficiarios.map((b, i) => (
            <CardFamiliar key={String(b.id ?? i)} beneficiario={b} />
          ))}
        </div>
      </Card>
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
