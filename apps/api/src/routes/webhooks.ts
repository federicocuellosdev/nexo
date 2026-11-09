import { Router } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from '../config.js';
import { supabaseAdmin } from '../lib/supabase.js';

export const webhooksRouter = Router();

/**
 * Verifica la firma HMAC de MercadoPago. Es el mismo algoritmo que usa el
 * portal v2 (nexo-portal-v2) y el mismo que arma el "staging proxy" cuando
 * reenvía un webhook: `HMAC_SHA256(message, secret)` donde `message` es
 * `id:${notificationId};request-id:${requestId};ts:${ts};`.
 *
 * El header `x-signature` viene en el formato `ts=<unix_ts>,v1=<hex>`.
 */
function verificarFirmaMp(
  xSignature: string,
  xRequestId: string,
  notificationId: string,
  secret: string,
): boolean {
  const partes: Record<string, string> = {};
  for (const chunk of xSignature.split(',')) {
    const [k, v] = chunk.split('=', 2);
    if (k && v) partes[k.trim()] = v.trim();
  }
  const { ts, v1 } = partes;
  if (!ts || !v1) return false;

  const mensaje = `id:${notificationId};request-id:${xRequestId};ts:${ts};`;
  const esperado = createHmac('sha256', secret).update(mensaje).digest('hex');

  try {
    return timingSafeEqual(Buffer.from(v1, 'hex'), Buffer.from(esperado, 'hex'));
  } catch {
    return false;
  }
}

interface MpWebhookBody {
  type?: string;
  action?: string;
  data?: { id?: string };
}

interface MpPreApproval {
  id: string;
  status: string;
  external_reference?: string;
  payer_email?: string;
  reason?: string;
  init_point?: string;
  auto_recurring?: { transaction_amount?: number; currency_id?: string };
}

/**
 * Lee la preapproval desde MP. Devuelve `null` si la petición falla — el
 * webhook igual contesta 200 porque MP reintenta en caso de 5xx y no queremos
 * loops por errores transitorios del lado de MP.
 */
async function obtenerPreapproval(id: string): Promise<MpPreApproval | null> {
  try {
    const res = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
      headers: { Authorization: `Bearer ${config.mp.accessToken}` },
    });
    if (!res.ok) {
      console.warn('[mp-webhook] preapproval fetch no-ok', res.status, id);
      return null;
    }
    return (await res.json()) as MpPreApproval;
  } catch (err) {
    console.error('[mp-webhook] preapproval fetch error', err);
    return null;
  }
}

interface MpPayment {
  id: number;
  status: string;
  transaction_amount: number;
  currency_id?: string;
  payer?: { email?: string };
  external_reference?: string;
  /** Cuando el pago viene de una suscripción, `metadata` lleva el preapproval_id. */
  metadata?: Record<string, unknown>;
  description?: string;
}

/** GET /v1/payments/:id — cobro individual (incluido los recurrentes de una preapproval). */
async function obtenerPayment(id: string): Promise<MpPayment | null> {
  try {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${config.mp.accessToken}` },
    });
    if (!res.ok) {
      console.warn('[mp-webhook] payment fetch no-ok', res.status, id);
      return null;
    }
    return (await res.json()) as MpPayment;
  } catch (err) {
    console.error('[mp-webhook] payment fetch error', err);
    return null;
  }
}

/**
 * Extrae el `preapproval_id` de un payment. MP lo deja en varios lugares según
 * la antigüedad del flujo: `metadata.preapproval_id`, `metadata.subscription_id`
 * (plan API) o adentro del `description`. Buscamos en orden de confiabilidad.
 */
function preapprovalIdDePayment(pago: MpPayment): string | null {
  const md = pago.metadata ?? {};
  const candidates = [md.preapproval_id, md.subscription_id, md.preapprovalId];
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c;
  }
  return null;
}

/** El leadId limpio = external_reference sin el sufijo `-test` del puente. */
function leadIdDeExternalRef(ref: string | undefined | null): string {
  const r = ref ?? '';
  return r.endsWith('-test') ? r.slice(0, -'-test'.length) : r;
}

function esUuid(s: string): boolean {
  return /^[0-9a-f-]{36}$/i.test(s);
}

interface FilaPago {
  lead_id?: string | null;
  mp_preapproval_id: string;
  mp_payment_id?: string | null;
  payer_email?: string | null;
  monto: number;
  moneda: string;
  status: string;
  external_reference?: string | null;
  raw: unknown;
}

async function insertarPago(fila: FilaPago): Promise<void> {
  const { error } = await supabaseAdmin.schema('v3').from('pagos').insert(fila);
  if (error) {
    // Unique violation del `mp_payment_id` → evento duplicado, no es error.
    if (error.code === '23505') {
      console.log('[mp-webhook] evento duplicado (unique mp_payment_id)', fila.mp_payment_id);
      return;
    }
    console.warn('[mp-webhook] no se pudo insertar en v3.pagos', error);
  }
}

/**
 * Webhook de MercadoPago. En staging recibe lo que el puente de producción
 * (nexo-portal-v2) reenvía cuando el `external_reference` termina en `-test`.
 * La firma la re-genera producción usando `STAGING_WEBHOOK_SECRET` =
 * `MP_WEBHOOK_SECRET` de este deployment.
 *
 * Dos clases de eventos nos importan:
 *   - `subscription_preapproval`: cambios de estado de la suscripción
 *     (pending → authorized → cancelled). Marca el alta y la baja.
 *   - `payment` (`payment.created`, `payment.updated`): cada cobro individual
 *     de la suscripción — primer pago y cada renovación mensual. Acá llegan
 *     los 2do, 3er, N-ésimo pagos.
 *
 * Los dos van a `v3.pagos`, y el flag `mp_payment_id` separa un evento de
 * suscripción (null) de un cobro concreto. También mantenemos `v3.leads`
 * actualizado con el último `mp_status` para no tener que joinear a `v3.pagos`
 * cada vez que queremos saber si un lead está activo.
 */
webhooksRouter.post('/webhooks/mercadopago', async (req, res) => {
  const xSignature = String(req.headers['x-signature'] ?? '');
  const xRequestId = String(req.headers['x-request-id'] ?? '');

  let body: MpWebhookBody;
  try {
    body = req.body as MpWebhookBody;
  } catch {
    return res.status(200).json({ ok: true });
  }

  const secret = config.mp.webhookSecret;
  if (secret && body.data?.id) {
    const firmaOk = verificarFirmaMp(xSignature, xRequestId, body.data.id, secret);
    if (!firmaOk) {
      console.warn('[mp-webhook] firma invalida — rechazado', {
        type: body.type,
        requestId: xRequestId,
      });
      // 200 (no 401): MP reintenta ante errores — devolvemos ok para que no
      // insista con un payload que ya sabemos que no vamos a aceptar.
      return res.status(200).json({ ok: true });
    }
  }

  if (!config.mp.accessToken) {
    console.warn('[mp-webhook] MP_ACCESS_TOKEN vacio, no se consulta la preapproval');
    return res.status(200).json({ ok: true });
  }

  console.log('[mp-webhook] recibido', { type: body.type, action: body.action, dataId: body.data?.id });

  if (body.type === 'subscription_preapproval' && body.data?.id) {
    const pa = await obtenerPreapproval(body.data.id);
    if (!pa) return res.status(200).json({ ok: true });

    const leadId = leadIdDeExternalRef(pa.external_reference);
    const leadRef = esUuid(leadId) ? leadId : null;

    console.log('[mp-webhook] preapproval', {
      id: pa.id,
      status: pa.status,
      external_reference: pa.external_reference,
      leadId,
    });

    await insertarPago({
      lead_id: leadRef,
      mp_preapproval_id: pa.id,
      mp_payment_id: null,
      payer_email: pa.payer_email ?? null,
      monto: pa.auto_recurring?.transaction_amount ?? 0,
      moneda: pa.auto_recurring?.currency_id ?? 'ARS',
      status: pa.status,
      external_reference: pa.external_reference ?? null,
      raw: body,
    });

    if (leadRef) {
      const { error } = await supabaseAdmin
        .schema('v3')
        .from('leads')
        .update({
          mp_preapproval_id: pa.id,
          mp_status: pa.status,
          mp_updated_at: new Date().toISOString(),
        })
        .eq('id', leadRef);
      if (error) console.warn('[mp-webhook] no se pudo actualizar v3.leads', error);
    }
  }

  // Cobros recurrentes. MP manda `type: 'payment'` con `data.id` = payment id.
  // Acá entran el 1er pago (que suele replicar el estado de la preapproval) y
  // los subsiguientes del cobro mensual.
  if (body.type === 'payment' && body.data?.id) {
    const pago = await obtenerPayment(body.data.id);
    if (!pago) return res.status(200).json({ ok: true });

    const preapprovalId = preapprovalIdDePayment(pago);
    if (!preapprovalId) {
      console.log('[mp-webhook] payment sin preapproval_id — no es de suscripcion, ignorado', pago.id);
      return res.status(200).json({ ok: true });
    }

    const leadId = leadIdDeExternalRef(pago.external_reference);
    const leadRef = esUuid(leadId) ? leadId : null;

    console.log('[mp-webhook] payment', {
      id: pago.id,
      status: pago.status,
      preapprovalId,
      leadId,
      monto: pago.transaction_amount,
    });

    await insertarPago({
      lead_id: leadRef,
      mp_preapproval_id: preapprovalId,
      mp_payment_id: String(pago.id),
      payer_email: pago.payer?.email ?? null,
      monto: pago.transaction_amount,
      moneda: pago.currency_id ?? 'ARS',
      status: pago.status,
      external_reference: pago.external_reference ?? null,
      raw: body,
    });
  }

  return res.status(200).json({ ok: true });
});
