import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';
import { emailClient } from '../lib/resend.js';
import { config } from '../config.js';
import { asuntoInvitacion, htmlInvitacion } from '../emails/invitacion.js';

export const referidosRouter = Router();

/**
 * Envío de invitación al programa de referidos. El portal postea
 *   { email, referidorEmail, referidorNombre?, referidorLeadId? }
 *
 * `referidorEmail` + `referidorNombre` SIEMPRE vienen del portal (los tiene
 * en sesion.usuario), así el saludo del email usa el nombre real sin
 * depender de un lookup contra v3.leads — que puede estar vacío si el usuario
 * fue declientado (cleanup post-prueba) o si invita antes de completar el
 * perfil. `referidorLeadId` es opcional y solo se guarda para FK cuando
 * existe la fila; si el lead desaparece después, el FK pasa a null por el
 * `on delete set null`.
 *
 * Toda invitación queda registrada en v3.referidos (con nombre + email del
 * referrer) y el status cicla pending → sent/failed según Resend.
 */
const PayloadInvitar = z.object({
  email: z.string().email(),
  referidorEmail: z.string().email(),
  referidorNombre: z.string().trim().min(1).optional(),
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
  const { email, referidorEmail, referidorNombre, referidorLeadId } = parsed.data;
  const emailNormalizado = email.trim().toLowerCase();
  const referidorEmailNorm = referidorEmail.trim().toLowerCase();
  const nombreParaEmail = referidorNombre?.trim() ?? '';

  // Upsert en v3.referidos: unique (lower(referidor_email), lower(email_invitado))
  // evita invitaciones duplicadas al mismo mail desde el mismo referrer. Si ya
  // existía, pisamos nombre/lead_id y el status vuelve a pending — el update
  // final de abajo lo deja en sent/failed.
  const { data: upserted, error: errorUpsert } = await supabaseAdmin
    .schema('v3')
    .from('referidos')
    .upsert(
      {
        referidor_email: referidorEmailNorm,
        referidor_nombre: nombreParaEmail || null,
        referidor_lead_id: referidorLeadId ?? null,
        email_invitado: emailNormalizado,
        email_status: 'pending',
        error: null,
      },
      { onConflict: 'referidor_email,email_invitado', ignoreDuplicates: false },
    )
    .select('id')
    .maybeSingle();
  if (errorUpsert) {
    console.error('[POST /referidos/invitar] upsert error', errorUpsert);
    // No corta el envío: si falla el log pero el mail sale, mejor eso que
    // bloquear al usuario.
  }
  const referidoRowId = upserted?.id ?? null;

  // El link del email va al catálogo público de la landing. config.landingUrl
  // es env explícita (LANDING_URL) — así un deploy split con landing y portal
  // en dominios distintos funciona sin tocar código.
  const landingBase = config.landingUrl.replace(/\/+$/, '');
  const catalogoUrl = `${landingBase}/catalogo`;

  try {
    const result = await emailClient.enviar({
      to: emailNormalizado,
      subject: asuntoInvitacion(nombreParaEmail),
      html: htmlInvitacion({
        referidorNombre: nombreParaEmail,
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
