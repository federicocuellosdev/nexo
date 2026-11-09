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

/**
 * Webhook de MercadoPago. En staging recibe lo que el puente de producción
 * (nexo-portal-v2) reenvía cuando el `external_reference` termina en `-test`.
 * La firma la re-genera producción usando `STAGING_WEBHOOK_SECRET` =
 * `MP_WEBHOOK_SECRET` de este deployment.
 *
 * Por ahora solo loguea + actualiza `v3.leads` cuando identifica el leadId
 * del external_reference. La materialización completa (crear afiliado, mandar
 * emails, etc.) vive en producción — acá queremos la señal de que llegó.
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

  // Tipo principal que nos interesa: subscription_preapproval. MP también
  // manda `payment.created`/`updated` pero esos necesitan otro hop
  // (authorized_payments → payment) que podemos implementar después.
  if (body.type === 'subscription_preapproval' && body.data?.id) {
    const pa = await obtenerPreapproval(body.data.id);
    if (!pa) return res.status(200).json({ ok: true });

    // Normalizamos el sufijo `-test` del puente para quedarnos con el leadId
    // puro (el UUID original con el que creamos la suscripción).
    const refCruda = pa.external_reference ?? '';
    const leadId = refCruda.endsWith('-test') ? refCruda.slice(0, -'-test'.length) : refCruda;

    console.log('[mp-webhook] preapproval', {
      id: pa.id,
      status: pa.status,
      external_reference: pa.external_reference,
      leadId,
    });

    // Si el leadId parece un UUID lo intentamos persistir contra v3.leads.
    const esUuid = /^[0-9a-f-]{36}$/i.test(leadId);
    if (esUuid) {
      const { error } = await supabaseAdmin
        .schema('v3')
        .from('leads')
        .update({
          mp_preapproval_id: pa.id,
          mp_status: pa.status,
          mp_updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);
      if (error) {
        console.warn('[mp-webhook] no se pudo actualizar v3.leads', error);
      }
    }
  }

  return res.status(200).json({ ok: true });
});
