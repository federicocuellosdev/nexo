import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config.js';

export const subscriptionsRouter = Router();

const PayloadSuscripcion = z.object({
  planId: z.string().min(1),
  planNombre: z.string().min(1),
  monto: z.number().positive(),
  emailMp: z.string().email(),
  /** Para enviar como `external_reference` y correlacionar el webhook con el lead. */
  leadId: z.string().uuid().optional(),
});

/**
 * Crea una suscripción (preapproval) en Mercado Pago para el plan elegido.
 * Devuelve `init_point` — la URL del checkout hosteado por MP donde el usuario
 * completa el pago. Mientras `MP_ACCESS_TOKEN` esté vacío, el endpoint responde
 * 503 para que el portal caiga a su flujo mock de /pago y no se cuelgue.
 *
 * Doc: https://www.mercadopago.com.ar/developers/es/reference/subscriptions/_preapproval/post
 */
subscriptionsRouter.post('/subscriptions', async (req, res) => {
  const parsed = PayloadSuscripcion.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: 'payload_invalido',
      detalles: parsed.error.flatten().fieldErrors,
    });
  }
  const datos = parsed.data;

  if (!config.mp.accessToken) {
    console.warn('[POST /subscriptions] MP_ACCESS_TOKEN vacío — flujo mock activo');
    return res.status(503).json({ ok: false, error: 'mp_no_configurado' });
  }

  // `back_url` es a dónde MP devuelve al usuario tras completar/cancelar el
  // checkout. `${PORTAL_URL}` ya incluye `/app` en prod y queda sin él en dev.
  const backUrl = `${config.portalUrl}/pago/exito`;

  // `external_reference` con sufijo `-test`: así el webhook de PRODUCCIÓN
  // (que es el que recibe las notificaciones de MP porque está configurado en
  // la cuenta del seller) detecta que es un pago de staging y lo reenvía a
  // nuestro webhook con firma HMAC regenerada usando STAGING_WEBHOOK_SECRET
  // = MP_WEBHOOK_SECRET de acá. Ver el "staging proxy" en
  // nexo-portal-v2/.../webhooks/mercadopago/route.ts (~línea 250).
  //
  // Si no hay leadId igual mandamos un sufijo discriminador — sin él el
  // webhook de producción no sabría que debe reenviar.
  const externalReference = `${datos.leadId ?? `nexo3-${Date.now()}`}-test`;

  const body = {
    reason: datos.planNombre,
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months' as const,
      transaction_amount: datos.monto,
      currency_id: 'ARS',
    },
    back_url: backUrl,
    payer_email: datos.emailMp,
    status: 'pending' as const,
    external_reference: externalReference,
  };

  try {
    const respuestaMp = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.mp.accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const crudo = await respuestaMp.text();
    if (!respuestaMp.ok) {
      console.error('[POST /subscriptions] MP devolvió error', respuestaMp.status, crudo);
      return res.status(502).json({ ok: false, error: 'mp_error', status: respuestaMp.status });
    }

    // MP devuelve `init_point` (prod) y `sandbox_init_point` (test).
    // Con una app en modo test el campo que abre el checkout es
    // `init_point` igual, pero ofrecemos los dos por si en el futuro
    // cambiamos de app.
    const data = JSON.parse(crudo) as {
      id: string;
      init_point: string;
      sandbox_init_point?: string;
    };

    return res.status(201).json({
      ok: true,
      preapprovalId: data.id,
      initPoint: data.sandbox_init_point ?? data.init_point,
    });
  } catch (err) {
    console.error('[POST /subscriptions] network error', err);
    return res.status(502).json({ ok: false, error: 'mp_network_error' });
  }
});

/**
 * Consulta el estado de una suscripción en MercadoPago. Lo usa /pago del portal
 * para hacer polling mientras el usuario completa el checkout en otra pestaña:
 * cuando MP devuelve `authorized` sabemos que el pago quedó firme y se puede
 * transicionar al estado de "pago confirmado" sin depender del webhook.
 */
subscriptionsRouter.get('/subscriptions/:id/status', async (req, res) => {
  const id = req.params.id;
  if (!/^[a-f0-9]{16,}$/i.test(id)) {
    return res.status(400).json({ ok: false, error: 'id_invalido' });
  }

  if (!config.mp.accessToken) {
    return res.status(503).json({ ok: false, error: 'mp_no_configurado' });
  }

  try {
    const respuestaMp = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
      headers: { Authorization: `Bearer ${config.mp.accessToken}` },
    });
    if (respuestaMp.status === 404) {
      return res.status(404).json({ ok: false, error: 'no_encontrada' });
    }
    if (!respuestaMp.ok) {
      console.error('[GET /subscriptions/:id/status] MP devolvió error', respuestaMp.status);
      return res.status(502).json({ ok: false, error: 'mp_error', status: respuestaMp.status });
    }
    const data = (await respuestaMp.json()) as { status: string };
    return res.status(200).json({ ok: true, status: data.status });
  } catch (err) {
    console.error('[GET /subscriptions/:id/status] network error', err);
    return res.status(502).json({ ok: false, error: 'mp_network_error' });
  }
});
