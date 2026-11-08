import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';
import { emailClient } from '../lib/resend.js';
import { config } from '../config.js';
import { asuntoBienvenida, htmlBienvenida } from '../emails/bienvenida.js';
import { sendLeadIntake } from '../sf/leads.js';

export const leadsRouter = Router();

// Shape del payload esperado desde la landing: SOLO los campos mínimos para
// obtener el sfLeadId desde SF /leads (nombre + apellido + DNI) + email para
// mandar el magic link. El resto de datos (teléfono, fecha de nacimiento,
// domicilio, CP) se completa después en el portal, para el /enrich.
const PayloadLead = z.object({
  tipo: z.enum(['plan', 'producto']),
  itemId: z.string().min(1),
  itemNombre: z.string().min(1),
  nombre: z.string().min(2),
  apellido: z.string().min(2),
  email: z.string().email(),
  dni: z.string().regex(/^\d{7,8}$/),
});

type PayloadLead = z.infer<typeof PayloadLead>;

leadsRouter.post('/leads', async (req, res) => {
  const parsed = PayloadLead.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: 'payload_invalido',
      detalles: parsed.error.flatten().fieldErrors,
    });
  }
  const datos = parsed.data;

  // 1. Insertamos el lead en v3.leads. Usamos service_role → se salta RLS.
  //    El select('id') recupera el ID autogenerado para después asociarlo al
  //    magic link.
  const { data: leadInsertado, error: errorInsert } = await supabaseAdmin
    .schema('v3')
    .from('leads')
    .insert({
      item_tipo: datos.tipo,
      item_id: datos.itemId,
      item_nombre: datos.itemNombre,
      nombre: datos.nombre,
      apellido: datos.apellido,
      email: datos.email.toLowerCase(),
      dni: datos.dni,
    })
    .select('id')
    .single();

  if (errorInsert || !leadInsertado) {
    console.error('[POST /leads] db insert error', errorInsert);
    return res.status(500).json({ ok: false, error: 'db_insert_error' });
  }

  // 2. Envío a Salesforce. Si SF_ENABLED=false devuelve un sfLeadId mock
  //    sin tocar la red; si está encendido hace el POST real y propaga el
  //    id devuelto. En cualquier caso guardamos lo que vuelva en la fila:
  //    así el día que se encienda no tenemos que backfillear nada.
  const sfResult = await sendLeadIntake({
    id: leadInsertado.id,
    firstName: datos.nombre,
    lastName: datos.apellido,
    email: datos.email.toLowerCase(),
    documentNumber: datos.dni,
  });

  if (sfResult.sfLeadId) {
    const { error: errorUpdateSf } = await supabaseAdmin
      .schema('v3')
      .from('leads')
      .update({
        sf_lead_id: sfResult.sfLeadId,
        sf_sent_at: new Date().toISOString(),
      })
      .eq('id', leadInsertado.id);
    if (errorUpdateSf) {
      // No hace fallar el request: el lead ya está en DB, el sfLeadId
      // puede resincronizarse después. Lo registramos para auditoría.
      console.error('[POST /leads] no se pudo actualizar sf_lead_id', errorUpdateSf);
    }
  } else if (!sfResult.ok) {
    console.warn('[POST /leads] SF devolvió error, el lead queda sin sfLeadId:', sfResult.error);
  }

  // 3. Generamos el magic link vía Supabase Auth. `type: 'magiclink'` crea el
  //    usuario si no existía (shouldCreateUser default true en magiclink).
  //    El `redirectTo` es a dónde cae el usuario tras clickear el link.
  const { data: linkData, error: errorLink } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: datos.email.toLowerCase(),
    options: {
      // En staging/prod el portal vive como subpath `/app` del dominio único
      // nexo-front (landing + portal sirviéndose juntos). En dev local, el
      // portal corre en su propio Vite en 5174: PORTAL_URL puede incluir
      // `/app` o no según el entorno, por eso no lo hardcodeamos acá.
      redirectTo: `${config.portalUrl}/auth/callback?leadId=${leadInsertado.id}`,
    },
  });

  if (errorLink || !linkData.properties?.action_link) {
    console.error('[POST /leads] magic link error', errorLink);
    // El lead quedó persistido: respondemos ok parcial para que el front no
    // vuelva a crear el lead y el usuario pueda reintentar el email después.
    return res.status(502).json({
      ok: false,
      error: 'magic_link_error',
      leadId: leadInsertado.id,
    });
  }

  const magicLink = linkData.properties.action_link;

  // 4. Mandamos el email con la plantilla propia (no el default de Supabase)
  //    para controlar branding + contenido.
  try {
    await emailClient.enviar({
      to: datos.email,
      subject: asuntoBienvenida(),
      html: htmlBienvenida({
        nombre: datos.nombre,
        magicLink,
        logoUrl: config.emailLogoUrl,
        nombrePlan: datos.itemNombre,
      }),
    });

    await supabaseAdmin
      .schema('v3')
      .from('leads')
      .update({ magic_link_sent_at: new Date().toISOString() })
      .eq('id', leadInsertado.id);
  } catch (err) {
    console.error('[POST /leads] email send error', err);
    return res.status(502).json({
      ok: false,
      error: 'email_send_error',
      leadId: leadInsertado.id,
    });
  }

  return res.status(201).json({
    ok: true,
    leadId: leadInsertado.id,
    sfLeadId: sfResult.sfLeadId,
    sfMock: sfResult.mock,
  });
});
