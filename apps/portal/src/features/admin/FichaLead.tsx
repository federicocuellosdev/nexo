import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, CreditCard, Receipt } from 'lucide-react';
import { Chip } from '@/ui/Chip';
import { Skeleton } from '@/ui/Skeleton';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Dialog } from '@/ui/Dialog';
import { supabase } from '@/lib/supabase';
import {
  obtenerLeadDetalle,
  obtenerLeadDetalleVendedor,
  actualizarCoberturaPausada,
  obtenerPagosLead,
  obtenerPagosLeadVendedor,
  type PagoMp,
} from '@/lib/api';

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

export interface FichaLeadProps {
  leadId: string;
  nombre: string;
  descripcion?: string;
  /** Vuelve al listado anterior. */
  onVolver: () => void;
  /** admin ve todo; vendedor solo sus leads. Sirve para elegir el endpoint. */
  fuente?: 'admin' | 'vendedor';
  /** Oculta el switch de cobertura (solo admin puede pausar). */
  sinAccionesAdmin?: boolean;
  /** Si está, Trazabilidad muestra el nombre del vendedor como botón que
   *  dispara esto. Sirve para navegar de la ficha del lead a la del
   *  vendedor atribuido. */
  onVerVendedor?: (vendedorId: string) => void;
  /** Click en el link "Ver ficha" de un familiar. */
  onVerFamiliar?: (beneficiarioId: string) => void;
}

/**
 * Vista full-section de la ficha de un lead. Layout de dos columnas estilo
 * Cuenta.tsx: tarjeta de identidad sticky a la izquierda con avatar + estado
 * de cobertura, y a la derecha secciones apiladas (Contacto, Plan, MP,
 * Domicilio, Trazabilidad, Integraciones, Familiares).
 */
export function FichaLead({ leadId, nombre, descripcion, onVolver, fuente = 'admin', sinAccionesAdmin = false, onVerVendedor, onVerFamiliar }: FichaLeadProps) {
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
        const det =
          fuente === 'vendedor'
            ? await obtenerLeadDetalleVendedor(token, leadId)
            : await obtenerLeadDetalle(token, leadId);
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
  }, [leadId, fuente]);

  const pausadaInicial = lead?.cobertura_pausada === true;
  // Afiliado = pagó + perfil completo. Solo para afiliados aplica el
  // concepto de "cobertura" (activa/pausada); un lead a secas es nada más
  // un usuario con datos y acceso a la app.
  const tieneCobertura =
    lead?.mp_status === 'authorized' &&
    typeof lead?.dni === 'string' &&
    lead.dni.length > 0 &&
    typeof lead?.fecha_nacimiento === 'string' &&
    lead.fecha_nacimiento.length > 0;

  return (
    <div data-entrada className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variante="secundario" tamano="sm" onClick={onVolver}>
          <ArrowLeft size={16} aria-hidden="true" />
          Volver
        </Button>
        {lead && tieneCobertura && !sinAccionesAdmin ? (
          <SwitchCobertura
            leadId={leadId}
            pausadaInicial={pausadaInicial}
            onCambio={(pausada, at) => {
              setLead((previo) =>
                previo ? { ...previo, cobertura_pausada: pausada, cobertura_pausada_at: at } : previo,
              );
            }}
          />
        ) : null}
      </div>

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
          <ColumnaDatos leadId={leadId} lead={lead} beneficiarios={beneficiarios} vendedor={vendedor} fuente={fuente} onVerVendedor={onVerVendedor} onVerFamiliar={onVerFamiliar} />
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
  const pausada = lead.cobertura_pausada === true;

  // Solo los afiliados (pagaron + perfil completo) tienen "cobertura". El
  // resto son leads: un usuario con datos y acceso a la app web, sin más.
  const chip = conCobertura
    ? pausada
      ? { tono: 'neutro' as const, texto: 'Cobertura pausada' }
      : { tono: 'ok' as const, texto: 'Activo' }
    : { tono: 'neutro' as const, texto: 'Acceso a la app web' };

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
  leadId: string;
  lead: Record<string, unknown>;
  beneficiarios: Array<Record<string, unknown>>;
  vendedor: Record<string, unknown> | null;
  fuente: 'admin' | 'vendedor';
  onVerVendedor?: (vendedorId: string) => void;
  onVerFamiliar?: (beneficiarioId: string) => void;
}

function ColumnaDatos({ leadId, lead, beneficiarios, vendedor, fuente, onVerVendedor, onVerFamiliar }: ColumnaDatosProps) {
  const [pagos, setPagos] = useState<PagoMp[] | null>(null);
  const [cargandoPagos, setCargandoPagos] = useState(true);
  const [verTransacciones, setVerTransacciones] = useState(false);

  useEffect(() => {
    let cancelado = false;
    void (async () => {
      try {
        if (!supabase) return;
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;
        const lista =
          fuente === 'vendedor'
            ? await obtenerPagosLeadVendedor(token, leadId)
            : await obtenerPagosLead(token, leadId);
        if (!cancelado) setPagos(lista);
      } catch (err) {
        console.warn('[ColumnaDatos] pagos error', err);
        if (!cancelado) setPagos([]);
      } finally {
        if (!cancelado) setCargandoPagos(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [leadId, fuente]);

  const ultimaTx = pagos && pagos.length > 0 ? pagos[0] : null;
  const primeraTx = pagos && pagos.length > 0 ? pagos[pagos.length - 1] : null;
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
          etiqueta="Código SF"
          valor={
            <span className="font-mono text-xs">
              {typeof lead.item_id === 'string' ? (SLUG_A_OFFER_CODE[lead.item_id] ?? '—') : '—'}
            </span>
          }
          ancho="completo"
        />
      </Seccion>


      <Seccion titulo="MercadoPago">
        <Dato
          etiqueta="ID de suscripción"
          valor={<span className="font-mono text-xs">{formatearValor(lead.mp_preapproval_id)}</span>}
        />
        <Dato etiqueta="Fecha de suscripción" valor={cargandoPagos ? '…' : formatearFecha(primeraTx?.received_at)} />
        <Dato
          etiqueta="ID última transacción"
          valor={
            cargandoPagos ? (
              '…'
            ) : (
              <span className="font-mono text-xs">{formatearValor(ultimaTx?.mp_payment_id ?? ultimaTx?.id)}</span>
            )
          }
        />
        <Dato
          etiqueta="Fecha última transacción"
          valor={cargandoPagos ? '…' : formatearFecha(ultimaTx?.received_at)}
        />
        <Dato etiqueta="Transacciones" valor={pagos ? `${pagos.length}` : '—'} />
        <Dato
          etiqueta="Historial"
          valor={
            <button
              type="button"
              onClick={() => setVerTransacciones(true)}
              className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-marca-700 hover:text-marca-800"
            >
              <Receipt size={14} aria-hidden="true" />
              Ver todas
            </button>
          }
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
        <Dato etiqueta="Canal" valor={<Chip tono="marca">{canal}</Chip>} />
        <Dato
          etiqueta="Vendedor"
          valor={
            canal === 'landing' && !vendedor ? (
              <span className="text-ink-500">No aplica</span>
            ) : vendedor ? (
              <button
                type="button"
                onClick={() => {
                  if (typeof vendedor.id === 'string') onVerVendedor?.(vendedor.id);
                }}
                className="cursor-pointer text-marca-700 underline-offset-2 hover:underline"
              >
                {`${formatearValor(vendedor.nombre)} ${formatearValor(vendedor.apellido)}`.trim()}
              </button>
            ) : (
              <span className="text-ink-500">Sin atribución</span>
            )
          }
        />
        <Dato etiqueta="Alta" valor={formatearFecha(lead.created_at)} />
        {vendedor?.etiqueta ? (
          <Dato
            etiqueta="Etiqueta vendedor"
            valor={
              <span className="inline-flex items-center rounded-pill bg-marca-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-marca-700">
                {String(vendedor.etiqueta)}
              </span>
            }
          />
        ) : null}
        <Dato etiqueta="Origen (utm_source)" valor={formatearValor(lead.utm_source)} />
        <Dato etiqueta="Medio (utm_medium)" valor={formatearValor(lead.utm_medium)} />
        <Dato etiqueta="Campaña (utm_campaign)" valor={formatearValor(lead.utm_campaign)} />
        <Dato etiqueta="Término (utm_term)" valor={formatearValor(lead.utm_term)} />
        <Dato etiqueta="Contenido (utm_content)" valor={formatearValor(lead.utm_content)} />
        <Dato
          etiqueta="Facebook click (fbclid)"
          valor={<span className="font-mono text-xs">{formatearValor(lead.fbclid)}</span>}
        />
        <Dato
          etiqueta="Google click (gclid)"
          valor={<span className="font-mono text-xs">{formatearValor(lead.gclid)}</span>}
        />
        <Dato
          etiqueta="Referer"
          valor={<span className="font-mono text-xs break-all">{formatearValor(lead.referer)}</span>}
          ancho="completo"
        />
      </Seccion>

      <Seccion titulo="Salesforce">
        <Dato
          etiqueta="Lead ID"
          valor={<span className="font-mono text-xs">{formatearValor(lead.sf_lead_id)}</span>}
        />
        <Dato etiqueta="Lead creado" valor={formatearFecha(lead.sf_sent_at)} />
        <Dato
          etiqueta="Account ID"
          valor={<span className="font-mono text-xs">{formatearValor(lead.sf_account_id)}</span>}
        />
        <Dato etiqueta="Cuenta creada" valor={formatearFecha(lead.sale_sent_at)} />
        <Dato
          etiqueta="Order ID"
          valor={<span className="font-mono text-xs">{formatearValor(lead.sf_order_id)}</span>}
        />
        <Dato etiqueta="Pedido creado" valor={formatearFecha(lead.sale_sent_at)} />
      </Seccion>

      {familiaresCount > 0 ? <SeccionFamiliares beneficiarios={beneficiarios} onVerFamiliar={onVerFamiliar} /> : null}

      {verTransacciones ? (
        <DialogoTransacciones
          pagos={pagos ?? []}
          cargando={cargandoPagos}
          onCerrar={() => setVerTransacciones(false)}
        />
      ) : null}
    </div>
  );
}

// ───────────────────────────── Dialog transacciones ─────────────────────────────

function DialogoTransacciones({
  pagos,
  cargando,
  onCerrar,
}: {
  pagos: PagoMp[];
  cargando: boolean;
  onCerrar: () => void;
}) {
  const totalMonto = pagos.reduce((acc, p) => acc + (p.monto ?? 0), 0);

  return (
    <Dialog
      abierto
      ancho="ancho"
      onCambio={(abierto) => {
        if (!abierto) onCerrar();
      }}
      titulo="Transacciones MercadoPago"
      descripcion={`${pagos.length} ${pagos.length === 1 ? 'pago registrado' : 'pagos registrados'} · Total ${totalMonto.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })}`}
    >
      {cargando ? (
        <p className="py-6 text-center text-sm text-ink-500">Cargando…</p>
      ) : pagos.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-500">Sin transacciones registradas.</p>
      ) : (
        <ul className="-mx-6 max-h-[65vh] overflow-y-auto divide-y divide-ink-100">
          {pagos.map((p) => (
            <FilaMovimientoAdmin key={p.id} pago={p} />
          ))}
        </ul>
      )}
    </Dialog>
  );
}

/**
 * Fila estilo MovimientoRow del portal cliente, con agregado de ID de
 * transacción (mono) al lado del concepto. Mismo tratamiento: icono
 * CreditCard, chip de estado y monto a la derecha.
 */
function FilaMovimientoAdmin({ pago }: { pago: PagoMp }) {
  const estadoOk = pago.status === 'authorized' || pago.status === 'approved';
  const textoEstado = estadoOk ? 'Pagada' : (pago.status ?? 'Pendiente');
  const idTx = pago.mp_payment_id ?? pago.id;

  return (
    <li className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-6 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto_auto]">
      <span
        aria-hidden="true"
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-pill bg-ink-100 text-ink-700"
      >
        <CreditCard size={14} />
      </span>

      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-ink-900">Cuota Previnca Nexo</span>
        <span className="truncate font-mono text-xs text-ink-500">{idTx}</span>
      </div>

      <span className="hidden text-sm text-ink-500 tabular-nums sm:inline">{formatearFecha(pago.received_at)}</span>

      <Chip tono={estadoOk ? 'ok' : 'warn'}>{textoEstado}</Chip>

      <span className="whitespace-nowrap text-right text-sm font-medium tabular-nums text-ink-900">
        {pago.monto !== null
          ? pago.monto.toLocaleString('es-AR', {
              style: 'currency',
              currency: pago.moneda ?? 'ARS',
              maximumFractionDigits: 0,
            })
          : '—'}
      </span>
    </li>
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

// ───────────────────────────── Familiares ─────────────────────────────

function SeccionFamiliares({
  beneficiarios,
  onVerFamiliar,
}: {
  beneficiarios: Array<Record<string, unknown>>;
  onVerFamiliar?: (beneficiarioId: string) => void;
}) {
  return (
    <section aria-label="Familiares">
      <Card className="flex flex-col gap-3">
        <h2 className="text-base font-medium text-ink-900">Familiares ({beneficiarios.length})</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {beneficiarios.map((b, i) => (
            <CardFamiliar
              key={String(b.id ?? i)}
              beneficiario={b}
              onVerFamiliar={onVerFamiliar}
            />
          ))}
        </div>
      </Card>
    </section>
  );
}

function CardFamiliar({
  beneficiario,
  onVerFamiliar,
}: {
  beneficiario: Record<string, unknown>;
  onVerFamiliar?: (beneficiarioId: string) => void;
}) {
  const nombre = `${formatearValor(beneficiario.nombre)} ${formatearValor(beneficiario.apellido)}`.trim();
  const id = typeof beneficiario.id === 'string' ? beneficiario.id : null;

  return (
    <div className="flex flex-col gap-2 rounded-campo bg-ink-50 p-4 ring-1 ring-ink-100">
      <p className="min-w-0 truncate text-sm font-medium text-ink-900">{nombre || '—'}</p>
      <span className="inline-flex w-fit items-center rounded-pill bg-marca-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-marca-700">
        Beneficiario
      </span>
      <span className="text-xs text-ink-600">DNI {formatearValor(beneficiario.dni)}</span>
      {id && onVerFamiliar ? (
        <button
          type="button"
          onClick={() => onVerFamiliar(id)}
          className="mt-1 self-start cursor-pointer text-xs font-medium text-marca-700 underline-offset-2 hover:underline"
        >
          Ver ficha →
        </button>
      ) : null}
    </div>
  );
}

// ───────────────────────────── Switch cobertura ─────────────────────────────

/**
 * Toggle "cobertura activa / pausada". Hoy solo marca el flag en DB (admin
 * intent); no interrumpe el cobro en MP ni avisa a SF. El admin lo ve por
 * si decide aplicar la pausa manualmente desde el panel de MP mientras
 * tanto. Optimistic update: cambia local primero, revierte si el PATCH
 * falla.
 */
interface SwitchCoberturaProps {
  leadId: string;
  pausadaInicial: boolean;
  onCambio: (pausada: boolean, at: string | null) => void;
}

function SwitchCobertura({ leadId, pausadaInicial, onCambio }: SwitchCoberturaProps) {
  const [pausada, setPausada] = useState(pausadaInicial);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setPausada(pausadaInicial);
  }, [pausadaInicial]);

  async function alternar() {
    if (guardando) return;
    const siguiente = !pausada;
    setPausada(siguiente);
    setGuardando(true);
    try {
      if (!supabase) throw new Error('supabase no configurado');
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('sesión expirada');
      const resultado = await actualizarCoberturaPausada(token, leadId, siguiente);
      onCambio(resultado.cobertura_pausada, resultado.cobertura_pausada_at);
    } catch (err) {
      console.error('[SwitchCobertura] error', err);
      setPausada(!siguiente);
      alert('No pudimos actualizar el estado de la cobertura.');
    } finally {
      setGuardando(false);
    }
  }

  const activa = !pausada;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-3 rounded-pill bg-white px-3 py-1.5 shadow-card ring-1 ring-ink-200">
        <span className="text-sm font-medium text-ink-900">Cobertura</span>
        <button
        type="button"
        role="switch"
        aria-checked={activa}
        aria-label={activa ? 'Pausar cobertura' : 'Reactivar cobertura'}
        disabled={guardando}
        onClick={alternar}
        className={[
          'inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-pill p-0.5 transition-colors duration-200',
          activa ? 'bg-marca-600' : 'bg-ink-300',
          guardando ? 'opacity-70' : '',
        ].join(' ')}
      >
        <span
          className={[
            'size-5 rounded-pill bg-white shadow-suave transition-transform duration-200 ease-out-quart',
            activa ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
      </div>
    </div>
  );
}
