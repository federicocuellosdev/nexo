import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';
import { emailClient } from '../lib/resend.js';
import { config } from '../config.js';
import { asuntoInvitacion, htmlInvitacion } from '../emails/invitacion.js';

export const referidosRouter = Router();

/**
 * Envío de invitación al programa de referidos. El flujo:
 *   1. Portal postea { email, referidorLeadId? }.
 *   2. Si viene referidorLeadId, buscamos el nombre del titular para
 *      personalizar el saludo del email ("Federico te invita a Nexo").
 *   3. Upsert en v3.referidos (unique por par referidor_lead_id + email).
 *   4. Resend manda el email con CTA al catálogo público de la landing.
 *   5. Updateamos email_status = sent (o failed si tiró Resend).
 *
 * `referidorLeadId` es opcional por si el caller no lo tiene a mano (por
 * ejemplo, invitaciones desde un flujo anónimo). Sin él se guarda el email
 * pero el saludo cae a "Alguien te invita a Nexo".
 */
const PayloadInvitar = z.object({
  email: z.string().email(),
  referidorLeadId: z.string().uuid().optional(),
});

referidosRouter.post('/referidos/invitar', async (req, res) => {
  const parsed = PayloadInvitar.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: 'payload_invalido',
      detalles: parsed.error.flatten().fieldErrors,
    });
  }
  const { email, referidorLeadId } = parsed.data;
  const emailNormalizado = email.trim().toLowerCase();

  // Nombre del referidor (opcional pero recomendable: el email se lee mejor
  // con "{Nombre} te invita a Nexo" que con "Alguien te invita").
  let referidorNombre = '';
  if (referidorLeadId) {
    const { data: refRow } = await supabaseAdmin
      .schema('v3')
      .from('leads')
      .select('nombre')
      .eq('id', referidorLeadId)
      .maybeSingle();
    if (refRow?.nombre) referidorNombre = refRow.nombre;
  }

  // Upsert en v3.referidos: unique (referidor_lead_id, lower(email)) evita
  // mandar varias invitaciones al mismo mail. Si ya existía, mantenemos la
  // fila (podría estar en failed y querramos reintentar — update de status
  // más abajo lo cubre).
  let referidoRowId: string | null = null;
  if (referidorLeadId) {
    const { data: upserted, error: errorUpsert } = await supabaseAdmin
      .schema('v3')
      .from('referidos')
      .upsert(
        { referidor_lead_id: referidorLeadId, email_invitado: emailNormalizado, email_status: 'pending' },
        { onConflict: 'referidor_lead_id,email_invitado', ignoreDuplicates: false },
      )
      .select('id')
      .maybeSingle();
    if (errorUpsert) {
      console.error('[POST /referidos/invitar] upsert error', errorUpsert);
      // No corta el envío: si falla el log pero el mail sale, mejor eso que
      // bloquear al usuario.
    }
    referidoRowId = upserted?.id ?? null;
  }

  // El link del email va al catálogo público de la landing. Derivamos la
  // base de landing recortando el subpath `/app` del portalUrl (en el deploy
  // unificado nexo-front, portal vive en /app y landing en /). En dev local
  // portalUrl ya es la raíz así que el replace es no-op.
  const landingBase = config.portalUrl.replace(/\/app\/?$/, '').replace(/\/+$/, '');
  const catalogoUrl = `${landingBase}/catalogo`;

  try {
    const result = await emailClient.enviar({
      to: emailNormalizado,
      subject: asuntoInvitacion(referidorNombre),
      html: htmlInvitacion({
        referidorNombre,
        catalogoUrl,
        logoUrl: config.emailLogoUrl,
      }),
    });
    if (referidoRowId) {
      await supabaseAdmin
        .schema('v3')
        .from('referidos')
        .update({
          email_status: 'sent',
          email_provider_id: result.id,
          sent_at: new Date().toISOString(),
          error: null,
        })
        .eq('id', referidoRowId);
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[POST /referidos/invitar] email send error', msg);
    if (referidoRowId) {
      await supabaseAdmin
        .schema('v3')
        .from('referidos')
        .update({ email_status: 'failed', error: msg })
        .eq('id', referidoRowId);
    }
    return res.status(502).json({ ok: false, error: 'email_send_error' });
  }
});
