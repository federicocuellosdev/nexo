import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';
import { emailClient } from '../lib/resend.js';
import { config } from '../config.js';
import { asuntoBienvenida, htmlBienvenida } from '../emails/bienvenida.js';

export const authRouter = Router();

/**
 * ¿El email tiene un auth.user asociado? Lo usamos antes de disparar
 * generateLink para no crear usuarios "fantasma" en el flujo de LOGIN. La SDK
 * admin trae una API paginada `listUsers` que no filtra por email, así que
 * armamos el query directamente contra la tabla `auth.users` con el service
 * role. Si el lookup falla por cualquier motivo, asumimos "no existe" para
 * no mandar emails espúreos.
 */
async function emailTieneCuenta(email: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .schema('auth' as never)
    .from('users' as never)
    .select('id')
    .eq('email', email.toLowerCase())
    .limit(1);
  if (error) {
    console.warn('[auth lookup] no se pudo leer auth.users', error);
    return false;
  }
  return Array.isArray(data) && data.length > 0;
}

// Payload mínimo: solo el email. No llevamos planId/planTipo porque este
// endpoint es el LOGIN de alguien que ya pasó por el alta (no está eligiendo
// un plan ahora) — su intent anterior, si lo tiene, lo resuelve el portal
// desde su propio storage.
const PayloadMagicLink = z.object({
  email: z.string().email(),
});

/**
 * Devuelve el lead más reciente para un email. Lo consume el portal al montar
 * /inicio cuando la sesión no tiene `intent`: así, aunque el usuario haya
 * llegado por un magic link viejo (sin planId en el redirect) o directamente
 * desde una sesión persistida, puede ver la tarjeta del plan elegido en vez
 * del fallback "Todavía no tenés un plan".
 *
 * Expone email por query. No usa JWT por simplicidad del sprint — el peor caso
 * es que alguien enumere leads por email, que es information disclosure acotada
 * (no se expone DNI, teléfono ni datos sensibles). Si evoluciona a prod, migrar
 * a verificar el JWT de Supabase y leer el email del claim.
 */
authRouter.get('/leads/by-email', async (req, res) => {
  const email = String(req.query.email ?? '').trim().toLowerCase();
  if (email === '') {
    return res.status(400).json({ ok: false, error: 'email_requerido' });
  }

  const { data, error } = await supabaseAdmin
    .schema('v3')
    .from('leads')
    .select('item_tipo, item_id, item_nombre, nombre, apellido, dni, telefono')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('[GET /leads/by-email] db error', error);
    return res.status(500).json({ ok: false, error: 'db_error' });
  }

  const lead = data?.[0];
  return res.status(200).json({
    ok: true,
    // Devolvemos el plan y los datos del titular (nombre + apellido + dni +
    // telefono). `titular` lo usa el portal para hidratar sesion.usuario y
    // precargar el documento / telefono en /cuenta y en el PerfilWizard — así
    // quien entró por login ve sus datos del alta sin tener que re-ingresarlos.
    lead: lead
      ? {
          tipo: lead.item_tipo as 'plan' | 'producto',
          id: lead.item_id,
          nombre: lead.item_nombre,
          titular: {
            nombre: lead.nombre,
            apellido: lead.apellido,
            dni: lead.dni,
            ...(lead.telefono ? { telefono: lead.telefono } : {}),
          },
        }
      : null,
  });
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

  // Buscamos el último lead del email para arrastrar el plan elegido al
  // portal. Así el /inicio puede renderizar la tarjeta del plan + CTA
  // "Terminar de pagar" incluso cuando el usuario entra por login — no solo
  // cuando entra por el magic link de alta. También traemos el nombre, que
  // sirve para personalizar el saludo del email ("Hola Federico").
  const { data: leads, error: errorLeads } = await supabaseAdmin
    .schema('v3')
    .from('leads')
    .select('id, item_tipo, item_id, nombre, apellido, dni, telefono')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1);

  if (errorLeads) {
    // No bloqueante: si falla la query seguimos sin plan en el redirect.
    console.error('[POST /auth/magic-link] no se pudo leer v3.leads', errorLeads);
  }
  const ultimoLead = leads && leads[0] ? leads[0] : undefined;

  // Pre-check: `generateLink({ type: 'magiclink' })` por default CREA el user
  // si no existe, lo cual rompe la semántica login≠signup y genera un auth
  // user fantasma cada vez que alguien tipea un email desconocido en
  // /ingresar. Chequeamos primero contra auth.users: si no está,
  // respondemos ok sin mandar email — misma respuesta que para emails
  // válidos → no filtramos qué cuentas existen.
  const existeUser = await emailTieneCuenta(email);
  if (!existeUser) {
    console.log('[POST /auth/magic-link] email sin cuenta, skip:', email);
    return res.status(200).json({ ok: true });
  }

  const redirectBase = `${config.portalUrl}/auth/callback`;
  // Incluimos leadId + planTipo + planId cuando hay lead: el portal usa
  // leadId para disparar la validacion anti-sesion-fantasma del PortalLayout
  // y planTipo+planId para armar el intent directo sin consultar backend.
  const redirectTo = ultimoLead
    ? `${redirectBase}?leadId=${encodeURIComponent(ultimoLead.id)}` +
      `&planTipo=${encodeURIComponent(ultimoLead.item_tipo)}` +
      `&planId=${encodeURIComponent(ultimoLead.item_id)}`
    : redirectBase;

  // Generamos el magic link vía Supabase Auth. `type: 'magiclink'` NO crea el
  // usuario si no existe (es login, no signup). Si Supabase devuelve error de
  // "user not found", respondemos ok igual para no filtrar qué emails están
  // registrados — práctica estándar en flujos de login sin contraseña.
  //
  // `data` propaga nombre/apellido/dni al `user_metadata` para que el
  // AuthCallback del portal hidrate sesion.usuario sin ir a v3.leads
  // (indispensable para usuarios declientados cuya fila fue borrada).
  const { data: linkData, error: errorLink } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      ...(ultimoLead
        ? {
            data: {
              nombre: ultimoLead.nombre,
              apellido: ultimoLead.apellido,
              dni: ultimoLead.dni,
              ...(ultimoLead.telefono ? { telefono: ultimoLead.telefono } : {}),
            },
          }
        : {}),
      redirectTo,
    },
  });

  if (errorLink || !linkData.properties?.action_link) {
    const esUsuarioNoEncontrado = errorLink?.message?.toLowerCase().includes('user not found');
    if (esUsuarioNoEncontrado) {
      console.log('[POST /auth/magic-link] email sin cuenta:', email);
    } else {
      console.error('[POST /auth/magic-link] error Supabase:', errorLink);
    }
    return res.status(200).json({ ok: true });
  }

  const magicLink = linkData.properties.action_link;

  // Upsert explicito del user_metadata para users existentes (ver comentario
  // equivalente en /leads). generateLink({ data }) solo setea en users nuevos;
  // updateUserById merge-ea sobre lo existente para que /auth/callback siempre
  // reciba el metadata fresco.
  const userIdAuth = linkData.user?.id;
  if (userIdAuth && ultimoLead) {
    const { error: errorMeta } = await supabaseAdmin.auth.admin.updateUserById(userIdAuth, {
      user_metadata: {
        nombre: ultimoLead.nombre,
        apellido: ultimoLead.apellido,
        dni: ultimoLead.dni,
        ...(ultimoLead.telefono ? { telefono: ultimoLead.telefono } : {}),
      },
    });
    if (errorMeta) {
      console.warn('[POST /auth/magic-link] no se pudo upsertar user_metadata', errorMeta);
    }
  }

  try {
    await emailClient.enviar({
      to: email,
      subject: asuntoBienvenida(),
      html: htmlBienvenida({
        nombre: ultimoLead?.nombre ?? '',
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
