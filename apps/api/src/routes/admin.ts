import { Router } from 'express';
import type { Request, Response } from 'express';
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
  if (token === '') return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user?.email) return null;
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
 * "Perfil completo" se aproxima con `documento_numero not null and
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
    .not('documento_numero', 'is', null)
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

/**
 * Lista de afiliados (titulares con pago autorizado). Incluye nombre, email,
 * teléfono, plan, fecha de alta y si tienen el perfil completo (= tienen
 * cobertura activa). Ordenados por created_at desc — el más reciente primero.
 *
 * MVP sin paginación ni filtros: devolvemos los últimos 200. Cuando crezca
 * se agrega `?desde=` + `?limit=` o server-side pagination.
 */
adminRouter.get('/admin/afiliados', requerirAdmin, async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .schema('v3')
    .from('leads')
    .select(
      'id, email, nombre, apellido, telefono, item_nombre, mp_status, documento_numero, fecha_nacimiento, created_at',
    )
    .eq('es_beneficiario', false)
    .eq('mp_status', 'authorized')
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
    plan: row.item_nombre,
    fechaAlta: row.created_at,
    conCobertura: row.documento_numero !== null && row.fecha_nacimiento !== null,
  }));

  return res.status(200).json({ ok: true, afiliados });
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
