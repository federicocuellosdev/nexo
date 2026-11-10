import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';
import { emailClient } from '../lib/resend.js';
import { config } from '../config.js';
import { asuntoBienvenida, htmlBienvenida } from '../emails/bienvenida.js';
import { sendLeadIntake } from '../sf/leads.js';
import { maybeDispararSaleIntake } from '../sf/saleIntakeTrigger.js';
import { registrarSfSync } from '../sf/syncLog.js';

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
  // Teléfono: 8-15 dígitos. Lo pedimos ya en el alta de la landing para
  // propagarlo como user_metadata.telefono y tenerlo listo en el perfil
  // sin pedírselo de nuevo. Opcional para no romper clientes viejos que
  // no mandaban el campo — hasta que el frontend migre a v2 del payload.
  telefono: z.string().regex(/^\d{8,15}$/).optional(),
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
      ...(datos.telefono ? { telefono: datos.telefono } : {}),
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

  // Auditoría completa en v3.sf_sync: payload + ack + status. Lead-Intake vive
  // en el v1/ de los contratos SF, por eso sigue cayendo en la tabla legacy
  // `sf_sync` en vez de una dedicada como las de v2 (sale/additional/order).
  // Fire-and-forget: si falla el log no hace rebotar el alta.
  await registrarSfSync({
    leadId: leadInsertado.id,
    operation: 'lead_intake',
    endpoint: '/leads',
    messageId: sfResult.payload.messageId,
    payload: sfResult.payload,
    httpStatus: sfResult.status,
    status: sfResult.ok ? 'success' : 'failed',
    response: sfResult.response,
    errorCode: sfResult.error ?? null,
    sfLeadId: sfResult.sfLeadId,
  });

  // 3. Generamos el magic link vía Supabase Auth. `type: 'magiclink'` crea el
  //    usuario si no existía (shouldCreateUser default true en magiclink).
  //    El `redirectTo` es a dónde cae el usuario tras clickear el link.
  //    `data` → raw_user_meta_data del usuario Supabase: así nombre/apellido/
  //    dni viajan en `data.session.user.user_metadata` y el portal puede
  //    hidratar `sesion.usuario` sin tener que ir a v3.leads (lo que fallaba
  //    para usuarios declientados cuya fila fue borrada).
  const { data: linkData, error: errorLink } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: datos.email.toLowerCase(),
    options: {
      data: {
        nombre: datos.nombre,
        apellido: datos.apellido,
        dni: datos.dni,
        ...(datos.telefono ? { telefono: datos.telefono } : {}),
      },
      // En staging/prod el portal vive como subpath `/app` del dominio único
      // nexo-front (landing + portal sirviéndose juntos). En dev local, el
      // portal corre en su propio Vite en 5174: PORTAL_URL puede incluir
      // `/app` o no según el entorno, por eso no lo hardcodeamos acá.
      //
      // `planTipo` + `planId` viajan para que el portal arme el `intent` con
      // el slug real del plan (ej. "nexo-1") y no con el leadId: así
      // `/inicio` puede renderizar el plan elegido con sus coberturas y el
      // CTA "Terminar de pagar" sin tener que consultar al backend.
      redirectTo:
        `${config.portalUrl}/auth/callback` +
        `?leadId=${leadInsertado.id}` +
        `&planTipo=${encodeURIComponent(datos.tipo)}` +
        `&planId=${encodeURIComponent(datos.itemId)}`,
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

  // Upsert explicito del user_metadata: `generateLink({ data })` solo lo
  // setea cuando crea un user nuevo. Para users existentes (re-altas, re-
  // logins) el `data` se ignora. updateUserById merge-ea sobre lo que ya
  // esta y asi el portal siempre lee nombre/apellido/dni/telefono frescos
  // desde user_metadata post-login, sin consultar v3.leads.
  const userId = linkData.user?.id;
  if (userId) {
    const { error: errorMeta } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        nombre: datos.nombre,
        apellido: datos.apellido,
        dni: datos.dni,
        ...(datos.telefono ? { telefono: datos.telefono } : {}),
      },
    });
    if (errorMeta) {
      console.warn('[POST /leads] no se pudo upsertar user_metadata', errorMeta);
    }
  }

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

/**
 * Perfil + beneficiarios del lead. Lo postea el portal desde el wizard de
 * `/perfil/completar` para que el backend pueda (a) mostrar datos consolidados
 * y (b) chequear `esPerfilCompleto` al recibir el webhook de MP y así disparar
 * automáticamente `sale_intake` cuando el pago se autorice.
 *
 * Valida con schemas laxos a propósito: el contrato final con SF se valida más
 * tarde; acá solo garantizamos tipos y campos mínimos para no quemar la fila.
 */
const PerfilDomicilio = z.object({
  calle: z.string().min(1),
  numero: z.string().min(1),
  piso: z.string().optional(),
  departamento: z.string().optional(),
  torre: z.string().optional(),
  localidad: z.string().min(1),
  provincia: z.string().min(1),
  cp: z.string().min(1),
  pais: z.string().min(1),
});

const PerfilPayload = z.object({
  tipoDocumento: z.enum(['DNI', 'Pasaporte']),
  numeroDocumento: z.string().min(5),
  sexo: z.enum(['F', 'M', 'X']),
  fechaNacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  domicilio: PerfilDomicilio,
  tieneObraSocial: z.boolean(),
  obraSocial: z.string().optional(),
  tipoContratacion: z.enum(['beneficiario', 'tomador', 'tomador-beneficiario']),
});

const BeneficiarioPayload = z.object({
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  tipoDocumento: z.enum(['DNI', 'Pasaporte']),
  numeroDocumento: z.string().min(5),
  sexo: z.enum(['F', 'M', 'X']),
  fechaNacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  relacion: z.enum(['conyuge', 'hijo', 'padre', 'madre', 'otro']),
});

const PayloadPerfilCompleto = z.object({
  perfil: PerfilPayload,
  beneficiarios: z.array(BeneficiarioPayload).default([]),
  familiaresCount: z.number().int().min(0).max(10),
});

leadsRouter.post('/leads/:id/perfil', async (req, res) => {
  const id = req.params.id;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return res.status(400).json({ ok: false, error: 'id_invalido' });
  }

  const parsed = PayloadPerfilCompleto.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: 'payload_invalido',
      detalles: parsed.error.flatten().fieldErrors,
    });
  }
  const datos = parsed.data;

  const { error } = await supabaseAdmin
    .schema('v3')
    .from('leads')
    .update({
      perfil: datos.perfil,
      beneficiarios: datos.beneficiarios,
      familiares_count: datos.familiaresCount,
      perfil_updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('[POST /leads/:id/perfil] db update error', error);
    return res.status(500).json({ ok: false, error: 'db_update_error' });
  }

  // Si el pago ya estaba autorizado (el usuario pagó primero y después
  // completó el perfil), este es el momento de disparar sale_intake.
  // La función revisa mp_status + sale_sent_at para no re-disparar.
  await maybeDispararSaleIntake(id);

  return res.status(200).json({ ok: true });
});

/**
 * Alta de beneficiarios (adherentes) asociados a un titular. Cada uno queda
 * como su propia fila en `v3.leads` con `es_beneficiario=true` y
 * `titular_lead_id` apuntando al titular. Si la tanda vino con un
 * `mp_preapproval_id` (la sub nueva que paga ese grupo), lo persistimos en
 * cada fila así después podemos correlacionar beneficiarios ↔ pago desde la
 * tabla `v3.pagos` por `mp_preapproval_id`.
 */
const BeneficiarioPayloadDb = z.object({
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  tipoDocumento: z.enum(['DNI', 'Pasaporte']),
  numeroDocumento: z.string().min(5),
  sexo: z.enum(['F', 'M', 'X']),
  fechaNacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  relacion: z.enum(['conyuge', 'hijo', 'padre', 'madre', 'otro']),
});

const PayloadBeneficiarios = z.object({
  beneficiarios: z.array(BeneficiarioPayloadDb).min(1).max(10),
  /** Opcional: id de la preapproval MP que paga esta tanda. Si llega, se
   *  guarda en `mp_preapproval_id` de cada fila para correlación futura. */
  mpPreapprovalId: z.string().optional(),
});

leadsRouter.post('/leads/:id/beneficiarios', async (req, res) => {
  const titularId = req.params.id;
  if (!/^[0-9a-f-]{36}$/i.test(titularId)) {
    return res.status(400).json({ ok: false, error: 'id_invalido' });
  }

  const parsed = PayloadBeneficiarios.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: 'payload_invalido',
      detalles: parsed.error.flatten().fieldErrors,
    });
  }
  const { beneficiarios, mpPreapprovalId } = parsed.data;

  // Hidratamos del titular los campos que un beneficiario "hereda": plan,
  // email (los adherentes no loguean con su propio email, así que el único
  // sensato es el del titular para no romper constraints no-null).
  const { data: titular, error: errorTitular } = await supabaseAdmin
    .schema('v3')
    .from('leads')
    .select('item_tipo, item_id, item_nombre, email')
    .eq('id', titularId)
    .maybeSingle();

  if (errorTitular || !titular) {
    console.error('[POST /leads/:id/beneficiarios] titular no encontrado', titularId, errorTitular);
    return res.status(404).json({ ok: false, error: 'titular_no_encontrado' });
  }

  const filas = beneficiarios.map((b) => ({
    item_tipo: titular.item_tipo,
    item_id: titular.item_id,
    item_nombre: titular.item_nombre,
    nombre: b.nombre.trim(),
    apellido: b.apellido.trim(),
    email: titular.email,
    dni: b.numeroDocumento.trim(),
    es_beneficiario: true,
    titular_lead_id: titularId,
    // Datos específicos del adherente que no tienen columna propia viajan
    // dentro del `perfil` jsonb — mismo patrón que los titulares.
    perfil: {
      tipoDocumento: b.tipoDocumento,
      numeroDocumento: b.numeroDocumento.trim(),
      sexo: b.sexo,
      fechaNacimiento: b.fechaNacimiento,
      relacion: b.relacion,
    },
    ...(mpPreapprovalId ? { mp_preapproval_id: mpPreapprovalId } : {}),
  }));

  const { data: insertados, error: errorInsert } = await supabaseAdmin
    .schema('v3')
    .from('leads')
    .insert(filas)
    .select('id');

  if (errorInsert || !insertados) {
    console.error('[POST /leads/:id/beneficiarios] db insert error', errorInsert);
    return res.status(500).json({ ok: false, error: 'db_insert_error' });
  }

  return res.status(201).json({
    ok: true,
    titularLeadId: titularId,
    beneficiarios: insertados.map((r) => r.id),
  });
});
