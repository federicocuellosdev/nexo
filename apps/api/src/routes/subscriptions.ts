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

  // `external_reference` sirve para encontrar la suscripción desde el webhook
  // sin tener que buscarla por payer_email (varios leads pueden compartir el
  // mismo email MP). Si no hay leadId se omite — MP no lo exige.
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
    ...(datos.leadId ? { external_reference: datos.leadId } : {}),
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
