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

/**
 * Lista de etiquetas (categorías / grupos) usadas por los vendedores. Se
 * deriva con DISTINCT sobre v3.vendedores.etiqueta — no mantenemos tabla
 * propia para no tener que sincronizar los dos lados. El frontend muestra
 * estos valores como lista + botón 'Crear etiqueta' para agregar uno nuevo
 * (que al guardar queda como string en la fila del vendedor).
 */
adminRouter.get('/admin/etiquetas', requerirAdmin, async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .schema('v3')
    .from('vendedores')
    .select('etiqueta')
    .not('etiqueta', 'is', null)
    .order('etiqueta', { ascending: true });

  if (error) {
    console.error('[GET /admin/etiquetas] db error', error);
    return res.status(500).json({ ok: false, error: 'db_error' });
  }

  const vistas = new Set<string>();
  const etiquetas: string[] = [];
  for (const row of data ?? []) {
    const et = typeof row.etiqueta === 'string' ? row.etiqueta.trim() : '';
    if (et !== '' && !vistas.has(et)) {
      vistas.add(et);
      etiquetas.push(et);
    }
  }

  return res.status(200).json({ ok: true, etiquetas });
});

/**
 * Lista de vendedores del programa de ventas. Cada uno tiene un id que viaja
 * como `?ref=` en su URL personal y le atribuye las ventas generadas por ese
 * link. NO son clientes — los clientes viven en v3.leads. `etiqueta` agrupa
 * vendedores por categoría ("PREVINCA", "Externos", etc).
 *
 * MVP sin paginación: devolvemos los últimos 200.
 */
adminRouter.get('/admin/vendedores', requerirAdmin, async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .schema('v3')
    .from('vendedores')
    .select('id, nombre, apellido, email, dni, telefono, etiqueta, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('[GET /admin/vendedores] db error', error);
    return res.status(500).json({ ok: false, error: 'db_error' });
  }

  const vendedores = (data ?? []).map((row) => ({
    id: row.id,
    nombre: row.nombre,
    apellido: row.apellido,
    email: row.email,
    dni: row.dni,
    telefono: row.telefono,
    etiqueta: row.etiqueta,
    fechaAlta: row.created_at,
  }));

  return res.status(200).json({ ok: true, vendedores });
});

/**
 * Actualiza datos del vendedor (nombre, apellido, dni, telefono, etiqueta).
 * Email no se puede editar — es la clave única humana; si hay que cambiarlo,
 * se borra y se crea de nuevo.
 */
const EdicionVendedor = z.object({
  nombre: z.string().trim().min(1).optional(),
  apellido: z.string().trim().min(1).optional(),
  dni: z.string().trim().optional(),
  telefono: z.string().trim().optional(),
  etiqueta: z.string().trim().optional(),
});

adminRouter.patch('/admin/vendedores/:id', requerirAdmin, async (req, res) => {
  const parsed = EdicionVendedor.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: 'payload_invalido',
      detalles: parsed.error.flatten().fieldErrors,
    });
  }

  const patch: Record<string, string | null> = {};
  if (parsed.data.nombre !== undefined) patch.nombre = parsed.data.nombre;
  if (parsed.data.apellido !== undefined) patch.apellido = parsed.data.apellido;
  if (parsed.data.dni !== undefined) patch.dni = parsed.data.dni === '' ? null : parsed.data.dni;
  if (parsed.data.telefono !== undefined) patch.telefono = parsed.data.telefono === '' ? null : parsed.data.telefono;
  if (parsed.data.etiqueta !== undefined) patch.etiqueta = parsed.data.etiqueta === '' ? null : parsed.data.etiqueta;

  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ ok: false, error: 'sin_cambios' });
  }

  const { error } = await supabaseAdmin
    .schema('v3')
    .from('vendedores')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', req.params.id);

  if (error) {
    console.error('[PATCH /admin/vendedores/:id] db error', error);
    return res.status(500).json({ ok: false, error: 'db_error' });
  }

  return res.status(200).json({ ok: true });
});

/**
 * Crea un vendedor desde el admin. Nombre + apellido + email son obligatorios;
 * DNI, teléfono y etiqueta opcionales. 409 si ya existe un vendedor con ese
 * email (unique sobre lower(email) en la tabla).
 */
const AltaVendedor = z.object({
  nombre: z.string().trim().min(1),
  apellido: z.string().trim().min(1),
  email: z.string().email(),
  dni: z.string().trim().optional(),
  telefono: z.string().trim().optional(),
  etiqueta: z.string().trim().optional(),
});

adminRouter.post('/admin/vendedores', requerirAdmin, async (req, res) => {
  const parsed = AltaVendedor.safeParse(req.body);
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
    .from('vendedores')
    .select('id')
    .ilike('email', emailNormalizado)
    .maybeSingle();

  if (existente) {
    return res.status(409).json({ ok: false, error: 'email_ya_registrado', id: existente.id });
  }

  const { data: nuevo, error } = await supabaseAdmin
    .schema('v3')
    .from('vendedores')
    .insert({
      nombre: parsed.data.nombre,
      apellido: parsed.data.apellido,
      email: emailNormalizado,
      dni: parsed.data.dni ?? null,
      telefono: parsed.data.telefono ?? null,
      etiqueta: parsed.data.etiqueta ?? null,
    })
    .select('id')
    .single();

  if (error || !nuevo) {
    console.error('[POST /admin/vendedores] db error', error);
    return res.status(500).json({ ok: false, error: 'db_error' });
  }

  return res.status(201).json({ ok: true, id: nuevo.id });
});

/**
 * Lista todos los leads (titulares) — pagaron o no. El frontend lo splitea
 * en dos tablas para la sección Negocio:
 *  - Afiliados = con cobertura (mp_status='authorized' + dni y fecha_nac
 *    cargados, proxy de 'perfil completo').
 *  - Leads = el resto del funnel (incluye los sin pagar y los pagados sin
 *    perfil completo).
 * Devolvemos campos resumen para la tabla; la ficha full va por /admin/leads/:id.
 */
adminRouter.get('/admin/leads', requerirAdmin, async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .schema('v3')
    .from('leads')
    .select('id, email, nombre, apellido, telefono, dni, fecha_nacimiento, item_nombre, mp_status, created_at')
    .eq('es_beneficiario', false)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    console.error('[GET /admin/leads] db error', error);
    return res.status(500).json({ ok: false, error: 'db_error' });
  }

  return res.status(200).json({ ok: true, leads: data ?? [] });
});

/**
 * Ficha detallada de un lead: todos los campos de v3.leads + beneficiarios
 * asociados (filas con titular_lead_id = este id). La UI muestra esto en
 * un dialog cuando el admin clickea una fila de la tabla Negocio.
 */
adminRouter.get('/admin/leads/:id', requerirAdmin, async (req, res) => {
  const id = req.params.id ?? '';
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return res.status(400).json({ ok: false, error: 'id_invalido' });
  }

  const { data: titular, error: errorTitular } = await supabaseAdmin
    .schema('v3')
    .from('leads')
    .select('*')
    .eq('id', id)
    .eq('es_beneficiario', false)
    .maybeSingle();

  if (errorTitular) {
    console.error('[GET /admin/leads/:id] db error', errorTitular);
    return res.status(500).json({ ok: false, error: 'db_error' });
  }
  if (!titular) {
    return res.status(404).json({ ok: false, error: 'no_encontrado' });
  }

  const { data: beneficiarios, error: errorBens } = await supabaseAdmin
    .schema('v3')
    .from('leads')
    .select('id, nombre, apellido, email, dni, telefono, fecha_nacimiento, perfil, created_at')
    .eq('titular_lead_id', id)
    .eq('es_beneficiario', true)
    .order('created_at', { ascending: true });

  if (errorBens) {
    console.error('[GET /admin/leads/:id] bens error', errorBens);
  }

  // Vendedor atribuido (trazabilidad): si vendedor_id esta seteado, traemos
  // el row completo de v3.vendedores para mostrarlo en la ficha. Query
  // separada en lugar de join para tener control fino del select.
  let vendedor: Record<string, unknown> | null = null;
  const vendedorIdDelLead = (titular as Record<string, unknown>).vendedor_id;
  if (typeof vendedorIdDelLead === 'string' && vendedorIdDelLead) {
    const { data: vendedorRow, error: errorVendedor } = await supabaseAdmin
      .schema('v3')
      .from('vendedores')
      .select('id, nombre, apellido, email, dni, telefono, etiqueta, created_at')
      .eq('id', vendedorIdDelLead)
      .maybeSingle();
    if (errorVendedor) {
      console.warn('[GET /admin/leads/:id] vendedor error', errorVendedor);
    } else {
      vendedor = vendedorRow;
    }
  }

  return res.status(200).json({
    ok: true,
    lead: titular,
    beneficiarios: beneficiarios ?? [],
    vendedor,
  });
});

/**
 * Toggle de "cobertura pausada". Hoy sólo marca la fila — todavía no corta
 * el cobro en MercadoPago ni avisa a SF. Sirve como registro de intención
 * del admin: si en el futuro se agrega la integración real, este flag es
 * el pivot que dispara el workflow de pausa/reactivación.
 */
adminRouter.patch('/admin/leads/:id/cobertura', requerirAdmin, async (req, res) => {
  const id = req.params.id ?? '';
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return res.status(400).json({ ok: false, error: 'id_invalido' });
  }
  const pausada = req.body?.pausada;
  if (typeof pausada !== 'boolean') {
    return res.status(400).json({ ok: false, error: 'payload_invalido' });
  }

  const { data, error } = await supabaseAdmin
    .schema('v3')
    .from('leads')
    .update({
      cobertura_pausada: pausada,
      cobertura_pausada_at: pausada ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .eq('es_beneficiario', false)
    .select('id, cobertura_pausada, cobertura_pausada_at')
    .maybeSingle();

  if (error || !data) {
    console.error('[PATCH /admin/leads/:id/cobertura] error', error);
    return res.status(500).json({ ok: false, error: 'db_update_error' });
  }

  return res.status(200).json({ ok: true, lead: data });
});
