import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';

export const adminRouter = Router();

/**
 * Valida el Bearer token del header y devuelve el email del usuario si el JWT
 * es válido. Usamos `supabaseAdmin.auth.getUser(token)` porque acepta tokens
 * emitidos por cualquier cliente (incluido el browser) y valida la firma
 * contra el proyecto. Null si falta token, está vencido o es inválido.
 */
async function emailDelToken(req: Request): Promise<string | null> {
  const auth = req.header('authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (token === '') {
    console.warn('[auth lookup] no bearer token en header');
    return null;
  }
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) {
    console.warn('[auth lookup] getUser error', {
      name: error.name,
      message: error.message,
      status: error.status,
    });
    return null;
  }
  if (!data.user?.email) {
    console.warn('[auth lookup] user sin email', { userId: data.user?.id });
    return null;
  }
  return data.user.email.toLowerCase();
}

/** Chequea si el email está en v3.admins. */
async function esAdmin(email: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .schema('v3')
    .from('admins')
    .select('email')
    .eq('email', email)
    .maybeSingle();
  return data !== null;
}

/**
 * Devuelve los roles del usuario autenticado. Todo usuario autenticado es
 * cliente por default; si además aparece en v3.admins, sumamos 'admin'.
 * El frontend usa esto para decidir si mostrar el selector cliente/admin.
 */
adminRouter.get('/me/roles', async (req, res) => {
  const email = await emailDelToken(req);
  if (email === null) {
    return res.status(401).json({ ok: false, error: 'no_autenticado' });
  }
  const admin = await esAdmin(email);
  return res.status(200).json({ ok: true, email, roles: admin ? ['cliente', 'admin'] : ['cliente'] });
});

/**
 * Middleware express: valida JWT + chequea rol admin. Responde 401/403 si no
 * corresponde; si pasa, deja req.adminEmail disponible para el handler.
 */
interface AdminRequest extends Request {
  adminEmail?: string;
}

async function requerirAdmin(req: AdminRequest, res: Response, next: () => void): Promise<void> {
  const email = await emailDelToken(req);
  if (email === null) {
    res.status(401).json({ ok: false, error: 'no_autenticado' });
    return;
  }
  const admin = await esAdmin(email);
  if (!admin) {
    res.status(403).json({ ok: false, error: 'no_autorizado' });
    return;
  }
  req.adminEmail = email;
  next();
}

/**
 * Contadores del dashboard admin:
 *  - leads: cuántos leads existen en total (titulares, no beneficiarios)
 *  - pagaron: titulares con mp_status = 'authorized'
 *  - conCobertura: pagaron AND perfil completo (campos del perfil llenos)
 *
 * "Perfil completo" se aproxima con `dni not null and
 * fecha_nacimiento not null` — los dos datos que el wizard de perfil siempre
 * carga primero y sin los que el sale_intake no se dispara.
 */
adminRouter.get('/admin/metrics', requerirAdmin, async (_req, res) => {
  const { count: leadsCount } = await supabaseAdmin
    .schema('v3')
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('es_beneficiario', false);

  const { count: pagaronCount } = await supabaseAdmin
    .schema('v3')
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('es_beneficiario', false)
    .eq('mp_status', 'authorized');

  const { count: conCoberturaCount } = await supabaseAdmin
    .schema('v3')
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('es_beneficiario', false)
    .eq('mp_status', 'authorized')
    .not('dni', 'is', null)
    .not('fecha_nacimiento', 'is', null);

  return res.status(200).json({
    ok: true,
    metricas: {
      leads: leadsCount ?? 0,
      pagaron: pagaronCount ?? 0,
      conCobertura: conCoberturaCount ?? 0,
    },
  });
});

/** Estado consolidado del afiliado derivado de mp_status + perfil. El front
 *  lo pinta con un chip de color (ok / warn / neutral). */
type EstadoAfiliado = 'con-cobertura' | 'pagado' | 'sin-pagar';

function derivarEstadoAfiliado(mpStatus: string | null, dni: string | null, fechaNac: string | null): EstadoAfiliado {
  if (mpStatus !== 'authorized') return 'sin-pagar';
  if (dni !== null && fechaNac !== null) return 'con-cobertura';
  return 'pagado';
}

/**
 * Lista de afiliados (titulares — no beneficiarios). Devuelve TODOS, no solo
 * los pagados, para que el admin pueda ver el funnel completo y los que
 * agregó manualmente desde el POST. Cada fila trae su `estado` consolidado
 * y suficiente info para armar la URL de atribución en el frontend.
 *
 * MVP sin paginación: devolvemos los últimos 200.
 */
adminRouter.get('/admin/afiliados', requerirAdmin, async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .schema('v3')
    .from('leads')
    .select(
      'id, email, nombre, apellido, telefono, dni, item_nombre, mp_status, fecha_nacimiento, created_at',
    )
    .eq('es_beneficiario', false)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('[GET /admin/afiliados] db error', error);
    return res.status(500).json({ ok: false, error: 'db_error' });
  }

  const afiliados = (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    nombre: row.nombre,
    apellido: row.apellido,
    telefono: row.telefono,
    dni: row.dni,
    plan: row.item_nombre,
    fechaAlta: row.created_at,
    estado: derivarEstadoAfiliado(row.mp_status, row.dni, row.fecha_nacimiento),
  }));

  return res.status(200).json({ ok: true, afiliados });
});

/**
 * Actualiza datos básicos de un titular (nombre, apellido, dni, telefono).
 * Cualquier campo que no venga en el body se deja como está. No tocamos
 * campos operativos (mp_status, sf_*, item_*) — esos se mueven por los
 * flujos de MP/SF, no por edición manual del admin.
 */
const EdicionAfiliado = z.object({
  nombre: z.string().trim().min(1).optional(),
  apellido: z.string().trim().min(1).optional(),
  dni: z.string().trim().min(1).optional(),
  telefono: z.string().trim().optional(),
});

adminRouter.patch('/admin/afiliados/:id', requerirAdmin, async (req, res) => {
  const parsed = EdicionAfiliado.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: 'payload_invalido',
      detalles: parsed.error.flatten().fieldErrors,
    });
  }

  const patch: Record<string, string> = {};
  if (parsed.data.nombre !== undefined) patch.nombre = parsed.data.nombre;
  if (parsed.data.apellido !== undefined) patch.apellido = parsed.data.apellido;
  if (parsed.data.dni !== undefined) patch.dni = parsed.data.dni;
  if (parsed.data.telefono !== undefined) patch.telefono = parsed.data.telefono;

  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ ok: false, error: 'sin_cambios' });
  }

  const { error } = await supabaseAdmin
    .schema('v3')
    .from('leads')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('es_beneficiario', false);

  if (error) {
    console.error('[PATCH /admin/afiliados/:id] db error', error);
    return res.status(500).json({ ok: false, error: 'db_error' });
  }

  return res.status(200).json({ ok: true });
});

/**
 * Crea un titular desde el admin. Mínimo nombre + apellido + email; el resto
 * opcional. Queda con `mp_status=null` y `es_beneficiario=false` — el alta
 * real (pago, perfil) la completa el usuario cuando entra por la URL de
 * atribución. Usamos el `nexo-1` como default item ya que es el único plan
 * publicado.
 *
 * No crea auth.users: ese paso ocurre cuando el usuario pide su magic link
 * por primera vez. Si el email ya existe como lead titular, devolvemos 409.
 */
const AltaAfiliado = z.object({
  nombre: z.string().trim().min(1),
  apellido: z.string().trim().min(1),
  email: z.string().email(),
  dni: z.string().trim().optional(),
  telefono: z.string().trim().optional(),
});

adminRouter.post('/admin/afiliados', requerirAdmin, async (req, res) => {
  const parsed = AltaAfiliado.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: 'payload_invalido',
      detalles: parsed.error.flatten().fieldErrors,
    });
  }

  const emailNormalizado = parsed.data.email.toLowerCase().trim();

  const { data: existente } = await supabaseAdmin
    .schema('v3')
    .from('leads')
    .select('id')
    .eq('email', emailNormalizado)
    .eq('es_beneficiario', false)
    .maybeSingle();

  if (existente) {
    return res.status(409).json({ ok: false, error: 'email_ya_registrado', leadId: existente.id });
  }

  const { data: nuevo, error } = await supabaseAdmin
    .schema('v3')
    .from('leads')
    .insert({
      nombre: parsed.data.nombre,
      apellido: parsed.data.apellido,
      email: emailNormalizado,
      dni: parsed.data.dni ?? null,
      telefono: parsed.data.telefono ?? null,
      es_beneficiario: false,
      item_tipo: 'plan',
      item_id: 'nexo-1',
      item_nombre: 'Previnca Nexo',
    })
    .select('id')
    .single();

  if (error || !nuevo) {
    console.error('[POST /admin/afiliados] db error', error);
    return res.status(500).json({ ok: false, error: 'db_error' });
  }

  return res.status(201).json({ ok: true, id: nuevo.id });
});

/**
 * Lista todos los leads (titulares) — pagaron o no. Más amplio que afiliados:
 * sirve para ver el funnel de alta sin filtrar por estado. Mismo cap de 200.
 */
adminRouter.get('/admin/leads', requerirAdmin, async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .schema('v3')
    .from('leads')
    .select('id, email, nombre, apellido, telefono, item_nombre, mp_status, created_at')
    .eq('es_beneficiario', false)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('[GET /admin/leads] db error', error);
    return res.status(500).json({ ok: false, error: 'db_error' });
  }

  return res.status(200).json({ ok: true, leads: data ?? [] });
});
