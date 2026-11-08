import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';
import { emailClient } from '../lib/resend.js';
import { config } from '../config.js';
import { asuntoBienvenida, htmlBienvenida } from '../emails/bienvenida.js';

export const authRouter = Router();

// Payload mínimo: solo el email. No llevamos planId/planTipo porque este
// endpoint es el LOGIN de alguien que ya pasó por el alta (no está eligiendo
// un plan ahora) — su intent anterior, si lo tiene, lo resuelve el portal
// desde su propio storage.
const PayloadMagicLink = z.object({
  email: z.string().email(),
});

authRouter.post('/auth/magic-link', async (req, res) => {
  const parsed = PayloadMagicLink.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: 'payload_invalido',
      detalles: parsed.error.flatten().fieldErrors,
    });
  }
  const email = parsed.data.email.toLowerCase();

  // Generamos el magic link vía Supabase Auth. `type: 'magiclink'` NO crea el
  // usuario si no existe (es login, no signup). Si Supabase devuelve error de
  // "user not found", respondemos ok igual para no filtrar qué emails están
  // registrados — práctica estándar en flujos de login sin contraseña.
  const { data: linkData, error: errorLink } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      // Sin planTipo/planId: el callback del portal no arma intent nuevo.
      redirectTo: `${config.portalUrl}/auth/callback`,
    },
  });

  if (errorLink || !linkData.properties?.action_link) {
    // Diferenciamos "email no registrado" del resto para loguearlo, pero
    // seguimos devolviendo 200 al cliente (no filtrar existencia).
    const esUsuarioNoEncontrado = errorLink?.message?.toLowerCase().includes('user not found');
    if (esUsuarioNoEncontrado) {
      console.log('[POST /auth/magic-link] email sin cuenta:', email);
    } else {
      console.error('[POST /auth/magic-link] error Supabase:', errorLink);
    }
    return res.status(200).json({ ok: true });
  }

  const magicLink = linkData.properties.action_link;

  try {
    await emailClient.enviar({
      to: email,
      subject: asuntoBienvenida(),
      html: htmlBienvenida({
        // Sin nombre: en login no tenemos el perfil cargado. El template saluda
        // con "Hola {nombre}" vacío queda "Hola" solo, que es aceptable para un
        // email de verificación sin contexto de alta.
        nombre: '',
        magicLink,
        logoUrl: config.emailLogoUrl,
        nombrePlan: '',
      }),
    });
  } catch (err) {
    console.error('[POST /auth/magic-link] email send error', err);
    return res.status(502).json({ ok: false, error: 'email_send_error' });
  }

  return res.status(200).json({ ok: true });
});
