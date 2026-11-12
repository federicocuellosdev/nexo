/**
 * Cliente mínimo contra `apps/api` desde el portal. Por ahora solo cubre el
 * disparo del magic link de login. Si aparecen más endpoints (enrich del
 * perfil, por ejemplo), mantener el mismo patrón: función por endpoint, tipos
 * del payload/respuesta explícitos, errores por `ApiError`.
 */
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export interface ErrorApi {
  ok: false;
  error: string;
  detalles?: Record<string, string[] | undefined>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly cuerpo: ErrorApi;
  constructor(cuerpo: ErrorApi, status: number) {
    super(cuerpo.error);
    this.name = 'ApiError';
    this.status = status;
    this.cuerpo = cuerpo;
  }
}

/**
 * Dispara el magic link de login. Responde `ok` incluso si el email no está
 * registrado (el backend no filtra existencia por diseño), así que el caller
 * siempre debe pasar a la pantalla de "revisá tu mail" tras la resolución.
 */
export async function pedirMagicLink(email: string): Promise<void> {
  const respuesta = await fetch(`${API_URL}/api/auth/magic-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({ ok: false, error: 'network' }))) as ErrorApi;
    throw new ApiError(cuerpo, respuesta.status);
  }
}

export interface LeadResumen {
  tipo: 'plan' | 'producto';
  id: string;
  nombre: string;
  /** Datos del titular del lead. Opcional por compat con backends viejos. */
  titular?: { nombre: string; apellido: string; dni?: string; telefono?: string };
}

/**
 * Lee el último lead del email desde v3.leads. Lo usa /inicio como fallback
 * cuando la sesión persistida no tiene `intent` (ej. magic link viejo sin
 * planId en el redirect). Devuelve `null` si no hay leads.
 */
export async function obtenerUltimoLead(email: string): Promise<LeadResumen | null> {
  const url = new URL(`${API_URL}/api/leads/by-email`);
  url.searchParams.set('email', email);
  const respuesta = await fetch(url.toString());
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({ ok: false, error: 'network' }))) as ErrorApi;
    throw new ApiError(cuerpo, respuesta.status);
  }
  const data = (await respuesta.json()) as { ok: true; lead: LeadResumen | null };
  return data.lead;
}

export interface PayloadSuscripcion {
  planId: string;
  planNombre: string;
  monto: number;
  emailMp: string;
  /**
   * UUID del titular en `v3.leads`. Viaja como `external_reference` en MP para
   * que el webhook pueda correlacionar el pago con la fila y actualizar
   * `mp_status` → disparar sale_intake cuando el pago quede autorizado.
   * Sin esto SF nunca recibe `/sales`.
   */
  leadId?: string;
}

export interface RespuestaSuscripcion {
  preapprovalId: string;
  /** URL del checkout hosteado por MP. Redirigir con window.location.href. */
  initPoint: string;
}

/**
 * Crea una suscripción (preapproval) en MercadoPago. Devuelve la URL del
 * checkout. El caller debe hacer `window.location.href = initPoint` para que
 * el usuario pague en el dominio de MP.
 */
export async function crearSuscripcion(payload: PayloadSuscripcion): Promise<RespuestaSuscripcion> {
  const respuesta = await fetch(`${API_URL}/api/subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({ ok: false, error: 'network' }))) as ErrorApi;
    throw new ApiError(cuerpo, respuesta.status);
  }
  const data = (await respuesta.json()) as { ok: true } & RespuestaSuscripcion;
  return { preapprovalId: data.preapprovalId, initPoint: data.initPoint };
}

/** Estados posibles que devuelve MP en una preapproval. Ver docs oficiales. */
export type EstadoSuscripcion = 'pending' | 'authorized' | 'paused' | 'cancelled' | string;

/**
 * Consulta el estado de una suscripción. Lo usa /pago para hacer polling
 * mientras el usuario completa el checkout en otra pestaña — el backend
 * consulta directo a MP (no depende del webhook).
 */
export async function consultarEstadoSuscripcion(preapprovalId: string): Promise<EstadoSuscripcion> {
  const respuesta = await fetch(`${API_URL}/api/subscriptions/${preapprovalId}/status`);
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({ ok: false, error: 'network' }))) as ErrorApi;
    throw new ApiError(cuerpo, respuesta.status);
  }
  const data = (await respuesta.json()) as { ok: true; status: EstadoSuscripcion };
  return data.status;
}

export interface SuscripcionResumen {
  preapprovalId: string;
  status: EstadoSuscripcion;
  reason?: string;
  monto: number | null;
  externalReference?: string;
  fechaCreacion?: string;
}

/**
 * Busca las suscripciones (preapprovals) creadas en MP para un email. Lo usa
 * /inicio para detectar pagos ya autorizados que no quedaron registrados en la
 * sesión local — p.ej. si el usuario cerró /pago antes del polling.
 */
export async function buscarSuscripcionesPorEmail(email: string): Promise<SuscripcionResumen[]> {
  const url = new URL(`${API_URL}/api/subscriptions/by-email`);
  url.searchParams.set('email', email);
  const respuesta = await fetch(url.toString());
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({ ok: false, error: 'network' }))) as ErrorApi;
    throw new ApiError(cuerpo, respuesta.status);
  }
  const data = (await respuesta.json()) as { ok: true; suscripciones: SuscripcionResumen[] };
  return data.suscripciones;
}

export interface PayloadPerfilBackend {
  perfil: {
    tipoDocumento: 'DNI' | 'Pasaporte';
    numeroDocumento: string;
    sexo: 'F' | 'M' | 'X';
    fechaNacimiento: string;
    domicilio: {
      calle: string;
      numero: string;
      piso?: string;
      departamento?: string;
      torre?: string;
      localidad: string;
      provincia: string;
      cp: string;
      pais: string;
    };
  };
  beneficiarios: Array<{
    nombre: string;
    apellido: string;
    tipoDocumento: 'DNI' | 'Pasaporte';
    numeroDocumento: string;
    sexo: 'F' | 'M' | 'X';
    fechaNacimiento: string;
    relacion: 'conyuge' | 'hijo' | 'padre' | 'madre' | 'otro';
  }>;
  familiaresCount: number;
}

export interface BeneficiarioBackend {
  nombre: string;
  apellido: string;
  tipoDocumento: 'DNI' | 'Pasaporte';
  numeroDocumento: string;
  sexo: 'F' | 'M' | 'X';
  fechaNacimiento: string;
  relacion: 'conyuge' | 'hijo' | 'padre' | 'madre' | 'otro';
}

/**
 * Da de alta N beneficiarios en `v3.leads` como filas propias con
 * `es_beneficiario=true` y `titular_lead_id` apuntando al titular. Si pasás
 * `mpPreapprovalId`, se guarda en cada fila para correlacionar con la tanda
 * de pago (`v3.pagos`).
 */
export async function altaBeneficiariosBackend(
  titularLeadId: string,
  beneficiarios: BeneficiarioBackend[],
  mpPreapprovalId?: string,
): Promise<string[]> {
  const respuesta = await fetch(`${API_URL}/api/leads/${titularLeadId}/beneficiarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      beneficiarios,
      ...(mpPreapprovalId ? { mpPreapprovalId } : {}),
    }),
  });
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({ ok: false, error: 'network' }))) as ErrorApi;
    throw new ApiError(cuerpo, respuesta.status);
  }
  const data = (await respuesta.json()) as { ok: true; beneficiarios: string[] };
  return data.beneficiarios;
}

/**
 * Enriquecimiento parcial del perfil: lo dispara el wizard en cada paso
 * "Continuar" para que SF reciba el estado actual del Lead aunque el
 * usuario todavía no haya terminado los 4 pasos. El backend hace merge
 * con lo cargado antes y re-postea el Lead a SF (que acepta upsert).
 *
 * Fire-and-forget desde la UI: no bloquea el avance del wizard. Si el
 * request falla, lo tragamos acá y lo logueamos en consola — el POST
 * final de `guardarPerfilBackend` tiene la última palabra.
 */
export interface PerfilParcialBackend {
  tipoDocumento?: 'DNI' | 'Pasaporte';
  numeroDocumento?: string;
  sexo?: 'F' | 'M' | 'X';
  fechaNacimiento?: string;
  domicilio?: {
    calle?: string;
    numero?: string;
    piso?: string;
    departamento?: string;
    torre?: string;
    localidad?: string;
    provincia?: string;
    cp?: string;
    pais?: string;
  };
}

export async function enviarPerfilParcial(leadId: string, parcial: PerfilParcialBackend): Promise<void> {
  try {
    const respuesta = await fetch(`${API_URL}/api/leads/${leadId}/perfil-paso`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parcial),
    });
    if (!respuesta.ok) {
      console.warn('[perfil-paso] backend respondió no-ok', respuesta.status);
    }
  } catch (err) {
    console.warn('[perfil-paso] network error', err);
  }
}

/**
 * Persiste perfil + beneficiarios en `v3.leads` y dispara `sale_intake` si ya
 * hay pago autorizado. El caller sigue guardando en sesion para no depender
 * del network; esto es append-only al backend.
 */
export async function guardarPerfilBackend(leadId: string, datos: PayloadPerfilBackend): Promise<void> {
  const respuesta = await fetch(`${API_URL}/api/leads/${leadId}/perfil`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({ ok: false, error: 'network' }))) as ErrorApi;
    throw new ApiError(cuerpo, respuesta.status);
  }
}

export interface PayloadInvitacion {
  /** Email del invitado (destinatario). */
  email: string;
  /** Email del referrer (siempre lo tenemos en sesion.usuario.email). */
  referidorEmail: string;
  /** Nombre del referrer para personalizar el saludo. Opcional: si falta, el
   *  backend cae a "Alguien te invita". */
  referidorNombre?: string;
  /** FK al lead del referrer. Opcional: la invitación queda registrada igual
   *  aunque la fila no exista en v3.leads (declientado / pre-perfil). */
  referidorLeadId?: string;
}

/**
 * Manda la invitación al programa de referidos. El backend upserta la fila en
 * `v3.referidos` (clave: referidor_email + email_invitado) y despacha un email
 * con CTA al catálogo público de la landing. Nombre y email del referrer
 * viajan en el payload — no depende del estado de v3.leads.
 */
export async function enviarInvitacion(payload: PayloadInvitacion): Promise<void> {
  const nombre = payload.referidorNombre?.trim();
  const respuesta = await fetch(`${API_URL}/api/referidos/invitar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: payload.email,
      referidorEmail: payload.referidorEmail,
      ...(nombre ? { referidorNombre: nombre } : {}),
      ...(payload.referidorLeadId ? { referidorLeadId: payload.referidorLeadId } : {}),
    }),
  });
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({ ok: false, error: 'network' }))) as ErrorApi;
    throw new ApiError(cuerpo, respuesta.status);
  }
}

// ──────────────────────────────── Admin ────────────────────────────────

export type Rol = 'cliente' | 'admin' | 'vendedor';

export interface PerfilRoles {
  email: string;
  roles: Rol[];
  /** UUID en v3.vendedores si el email coincide con un vendedor. */
  vendedorId: string | null;
  /** Código corto 6 chars — shortcut para no re-fetchear al mostrar la URL
   *  de atribución en el panel del vendedor. */
  codigoCorto: string | null;
}

/**
 * Devuelve los roles del usuario autenticado + info del vendedor si aplica.
 * Degradamos grácilmente a `['cliente']` sin vendedor si algo falla.
 */
export async function obtenerMisRoles(accessToken: string): Promise<Rol[]> {
  const res = await obtenerPerfilRoles(accessToken);
  return res.roles;
}

export async function obtenerPerfilRoles(accessToken: string): Promise<PerfilRoles> {
  const respuesta = await fetch(`${API_URL}/api/me/roles`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!respuesta.ok) {
    console.warn('[obtenerPerfilRoles] respuesta no ok', respuesta.status);
    return { email: '', roles: ['cliente'], vendedorId: null, codigoCorto: null };
  }
  const data = (await respuesta.json()) as {
    ok: true;
    email: string;
    roles: Rol[];
    vendedorId: string | null;
    codigoCorto: string | null;
  };
  return {
    email: data.email,
    roles: data.roles,
    vendedorId: data.vendedorId,
    codigoCorto: data.codigoCorto,
  };
}

export interface MetricasAdmin {
  leads: number;
  pagaron: number;
  conCobertura: number;
}

export async function obtenerMetricasAdmin(accessToken: string): Promise<MetricasAdmin> {
  const respuesta = await fetch(`${API_URL}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({ ok: false, error: 'network' }))) as ErrorApi;
    throw new ApiError(cuerpo, respuesta.status);
  }
  const data = (await respuesta.json()) as { ok: true; metricas: MetricasAdmin };
  return data.metricas;
}

export interface VendedorAdmin {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  dni: string | null;
  telefono: string | null;
  etiqueta: string | null;
  /** Código corto único (6 chars A-Z0-9) para URL de atribución de ventas.
   *  Se auto-genera al crear el vendedor; el admin lo ve en la tabla y lo
   *  comparte como `?ref=ABC123` en vez del UUID largo. */
  codigo_corto: string;
  fechaAlta: string;
}

export async function obtenerVendedoresAdmin(accessToken: string): Promise<VendedorAdmin[]> {
  const respuesta = await fetch(`${API_URL}/api/admin/vendedores`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({ ok: false, error: 'network' }))) as ErrorApi;
    throw new ApiError(cuerpo, respuesta.status);
  }
  const data = (await respuesta.json()) as { ok: true; vendedores: VendedorAdmin[] };
  return data.vendedores;
}

export interface EdicionVendedor {
  nombre?: string;
  apellido?: string;
  email?: string;
  dni?: string;
  telefono?: string;
  etiqueta?: string;
}

export async function editarVendedorAdmin(
  accessToken: string,
  id: string,
  patch: EdicionVendedor,
): Promise<void> {
  const respuesta = await fetch(`${API_URL}/api/admin/vendedores/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({ ok: false, error: 'network' }))) as ErrorApi;
    throw new ApiError(cuerpo, respuesta.status);
  }
}

export interface AltaVendedor {
  nombre: string;
  apellido: string;
  email: string;
  dni?: string;
  telefono?: string;
  etiqueta?: string;
}

/**
 * Ficha de un beneficiario (familiar). El backend devuelve la fila completa
 * del beneficiario + un resumen del titular al que está vinculado (nombre,
 * mp_preapproval_id, canal, etc.) para mostrar el link de vuelta.
 */
export interface FichaBeneficiario {
  beneficiario: Record<string, unknown>;
  titular: Record<string, unknown> | null;
}

export async function obtenerBeneficiarioAdmin(accessToken: string, id: string): Promise<FichaBeneficiario> {
  const respuesta = await fetch(`${API_URL}/api/admin/beneficiarios/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({ ok: false, error: 'network' }))) as ErrorApi;
    throw new ApiError(cuerpo, respuesta.status);
  }
  const data = (await respuesta.json()) as {
    ok: true;
    beneficiario: Record<string, unknown>;
    titular: Record<string, unknown> | null;
  };
  return { beneficiario: data.beneficiario, titular: data.titular };
}

/**
 * Ficha de un vendedor específico (para el admin).
 */
export async function obtenerVendedorAdmin(accessToken: string, id: string): Promise<VendedorAdmin> {
  const respuesta = await fetch(`${API_URL}/api/admin/vendedores/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({ ok: false, error: 'network' }))) as ErrorApi;
    throw new ApiError(cuerpo, respuesta.status);
  }
  const data = (await respuesta.json()) as { ok: true; vendedor: VendedorAdmin };
  return data.vendedor;
}

/**
 * KPIs del vendedor filtrados por rango temporal. desde/hasta son ISO
 * strings (YYYY-MM-DD o full ISO). Mismo shape que MetricasAdmin.
 */
export async function obtenerMetricasVendedorAdmin(
  accessToken: string,
  id: string,
  opciones?: { desde?: string; hasta?: string },
): Promise<MetricasAdmin> {
  const query = new URLSearchParams();
  if (opciones?.desde) query.set('desde', opciones.desde);
  if (opciones?.hasta) query.set('hasta', opciones.hasta);
  const qs = query.toString();
  const respuesta = await fetch(`${API_URL}/api/admin/vendedores/${id}/metrics${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({ ok: false, error: 'network' }))) as ErrorApi;
    throw new ApiError(cuerpo, respuesta.status);
  }
  const data = (await respuesta.json()) as { ok: true; metricas: MetricasAdmin };
  return data.metricas;
}

/**
 * Lista de etiquetas distintas ya cargadas en v3.vendedores. El combobox
 * del alta las usa para autocomplete: tipeás "previnca" y aparece la
 * existente si matchea, si no aparece la opción "Crear etiqueta 'XYZ'"
 * para normalizar y evitar duplicados.
 */
export async function obtenerEtiquetasAdmin(accessToken: string): Promise<string[]> {
  const respuesta = await fetch(`${API_URL}/api/admin/etiquetas`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({ ok: false, error: 'network' }))) as ErrorApi;
    throw new ApiError(cuerpo, respuesta.status);
  }
  const data = (await respuesta.json()) as { ok: true; etiquetas: string[] };
  return data.etiquetas;
}

export async function crearVendedorAdmin(accessToken: string, payload: AltaVendedor): Promise<string> {
  const respuesta = await fetch(`${API_URL}/api/admin/vendedores`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({ ok: false, error: 'network' }))) as ErrorApi;
    throw new ApiError(cuerpo, respuesta.status);
  }
  const data = (await respuesta.json()) as { ok: true; id: string };
  return data.id;
}

/** Reenvía al vendedor el mail de acceso (tabla de datos + magic link nuevo). */
export async function reenviarEmailVendedor(accessToken: string, id: string): Promise<void> {
  const respuesta = await fetch(`${API_URL}/api/admin/vendedores/${id}/reenviar-email`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({ ok: false, error: 'network' }))) as ErrorApi;
    throw new ApiError(cuerpo, respuesta.status);
  }
}

// ─────────────── Negocio (admin: afiliados + leads del funnel) ───────────────

export interface LeadResumenAdmin {
  id: string;
  email: string;
  nombre: string | null;
  apellido: string | null;
  telefono: string | null;
  dni: string | null;
  fecha_nacimiento: string | null;
  item_nombre: string | null;
  mp_status: string | null;
  created_at: string;
  /** JSON del perfil wizard (sexo, tipoDocumento, numeroDocumento,
   *  fechaNacimiento, domicilio). Lo usa `calcularCompletitud` para el
   *  porcentaje que ve el admin en la tabla de Leads. */
  perfil: Record<string, unknown> | null;
  /** true cuando la fila es un beneficiario (familiar). El backend
   *  hereda mp_status del titular en el enrich, así que esAfiliado()
   *  funciona igual para ambos. */
  es_beneficiario?: boolean;
  /** FK al titular si `es_beneficiario = true`. Permite abrir la ficha
   *  de familiar al clickear en el listado. */
  titular_lead_id?: string | null;
  /** Para beneficiarios el backend lo propaga del titular. Lo usamos
   *  para pintar el chip Pausado en la tabla. */
  cobertura_pausada?: boolean;
}

/**
 * Porcentaje 0–100 de perfil del titular. Mide SOLO los datos que el usuario
 * carga (nombre/apellido/email/telefono/dni + perfil + domicilio), ignorando
 * los campos transaccionales que se completan solos (sf_*, mp_*, utm_*).
 * No considera familiares — el titular es el único que accede a cobertura.
 *
 * Campos obligatorios (12):
 *   - Contacto: nombre, apellido, email, telefono, dni
 *   - Identidad: sexo, fechaNacimiento
 *   - Domicilio: calle, numero, localidad, provincia, cp, pais
 *     (piso / depto / torre se excluyen: no aplican a todos los domicilios)
 */
export function calcularCompletitud(lead: LeadResumenAdmin): number {
  const perfil = lead.perfil ?? {};
  const dom =
    perfil && typeof (perfil as Record<string, unknown>).domicilio === 'object'
      ? ((perfil as Record<string, unknown>).domicilio as Record<string, unknown>)
      : {};
  const campos: Array<unknown> = [
    lead.nombre,
    lead.apellido,
    lead.email,
    lead.telefono,
    lead.dni,
    (perfil as Record<string, unknown>).sexo,
    lead.fecha_nacimiento ?? (perfil as Record<string, unknown>).fechaNacimiento,
    dom.calle,
    dom.numero,
    dom.localidad,
    dom.provincia,
    dom.cp,
    dom.pais,
  ];
  // Total = 13 campos. Un string vacío o null no cuenta.
  const completados = campos.filter((v) => typeof v === 'string' && v.trim().length > 0).length;
  return Math.round((completados / campos.length) * 100);
}

export async function obtenerLeadsAdmin(accessToken: string): Promise<LeadResumenAdmin[]> {
  const respuesta = await fetch(`${API_URL}/api/admin/leads`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({ ok: false, error: 'network' }))) as ErrorApi;
    throw new ApiError(cuerpo, respuesta.status);
  }
  const data = (await respuesta.json()) as { ok: true; leads: LeadResumenAdmin[] };
  return data.leads;
}

export interface LeadDetalle {
  /** Toda la fila de v3.leads tal cual, para mostrarla en la ficha. Queda
   *  como Record<string, unknown> para evitar mantener el shape redundante
   *  — la UI accede campo a campo y hace el formateo. */
  lead: Record<string, unknown>;
  beneficiarios: Array<Record<string, unknown>>;
  /** Vendedor que atribuyó esta venta (si el lead tiene vendedor_id).
   *  Null cuando el lead vino sin atribución (p. ej. landing directo). */
  vendedor: Record<string, unknown> | null;
}

export async function obtenerLeadDetalle(accessToken: string, id: string): Promise<LeadDetalle> {
  const respuesta = await fetch(`${API_URL}/api/admin/leads/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({ ok: false, error: 'network' }))) as ErrorApi;
    throw new ApiError(cuerpo, respuesta.status);
  }
  const data = (await respuesta.json()) as {
    ok: true;
    lead: Record<string, unknown>;
    beneficiarios: Array<Record<string, unknown>>;
    vendedor: Record<string, unknown> | null;
  };
  return { lead: data.lead, beneficiarios: data.beneficiarios, vendedor: data.vendedor ?? null };
}

/** Un lead es "afiliado" (con cobertura) cuando pagó y tiene perfil completo
 *  (dni + fecha_nacimiento). Igual que la métrica del dashboard. */
export function esAfiliado(lead: LeadResumenAdmin): boolean {
  return lead.mp_status === 'authorized' && lead.dni !== null && lead.fecha_nacimiento !== null;
}

/**
 * Transacciones MP del titular. Las devuelve ordenadas desde la más reciente,
 * leyendo v3.pagos vía backend admin.
 */
export interface PagoMp {
  id: string;
  mp_payment_id: string | null;
  mp_preapproval_id: string | null;
  payer_email: string | null;
  monto: number | null;
  moneda: string | null;
  status: string | null;
  external_reference: string | null;
  received_at: string;
}

export async function obtenerPagosLead(accessToken: string, leadId: string): Promise<PagoMp[]> {
  const respuesta = await fetch(`${API_URL}/api/admin/leads/${leadId}/pagos`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({ ok: false, error: 'network' }))) as ErrorApi;
    throw new ApiError(cuerpo, respuesta.status);
  }
  const data = (await respuesta.json()) as { ok: true; pagos: PagoMp[] };
  return data.pagos;
}

/**
 * Setea el flag `cobertura_pausada` del titular. Hoy el backend sólo marca
 * la fila — no corta el cobro en MP ni avisa a SF. El switch de la ficha
 * usa esto como registro de intención del admin.
 */
export async function actualizarCoberturaPausada(
  accessToken: string,
  leadId: string,
  pausada: boolean,
): Promise<{ cobertura_pausada: boolean; cobertura_pausada_at: string | null }> {
  const respuesta = await fetch(`${API_URL}/api/admin/leads/${leadId}/cobertura`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ pausada }),
  });
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({ ok: false, error: 'network' }))) as ErrorApi;
    throw new ApiError(cuerpo, respuesta.status);
  }
  const data = (await respuesta.json()) as {
    ok: true;
    lead: { id: string; cobertura_pausada: boolean; cobertura_pausada_at: string | null };
  };
  return {
    cobertura_pausada: data.lead.cobertura_pausada,
    cobertura_pausada_at: data.lead.cobertura_pausada_at,
  };
}

// ──────────────────── Vendedor (scope: datos propios) ────────────────────

export async function obtenerPerfilVendedor(accessToken: string): Promise<VendedorAdmin> {
  const respuesta = await fetch(`${API_URL}/api/vendedor/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({ ok: false, error: 'network' }))) as ErrorApi;
    throw new ApiError(cuerpo, respuesta.status);
  }
  const data = (await respuesta.json()) as { ok: true; vendedor: VendedorAdmin };
  return data.vendedor;
}

export async function obtenerMetricasVendedor(accessToken: string): Promise<MetricasAdmin> {
  const respuesta = await fetch(`${API_URL}/api/vendedor/me/metrics`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({ ok: false, error: 'network' }))) as ErrorApi;
    throw new ApiError(cuerpo, respuesta.status);
  }
  const data = (await respuesta.json()) as { ok: true; metricas: MetricasAdmin };
  return data.metricas;
}

export async function obtenerLeadsVendedor(accessToken: string): Promise<LeadResumenAdmin[]> {
  const respuesta = await fetch(`${API_URL}/api/vendedor/me/leads`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({ ok: false, error: 'network' }))) as ErrorApi;
    throw new ApiError(cuerpo, respuesta.status);
  }
  const data = (await respuesta.json()) as { ok: true; leads: LeadResumenAdmin[] };
  return data.leads;
}

export async function obtenerLeadDetalleVendedor(accessToken: string, id: string): Promise<LeadDetalle> {
  const respuesta = await fetch(`${API_URL}/api/vendedor/me/leads/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({ ok: false, error: 'network' }))) as ErrorApi;
    throw new ApiError(cuerpo, respuesta.status);
  }
  const data = (await respuesta.json()) as {
    ok: true;
    lead: Record<string, unknown>;
    beneficiarios: Array<Record<string, unknown>>;
    vendedor: Record<string, unknown> | null;
  };
  return { lead: data.lead, beneficiarios: data.beneficiarios, vendedor: data.vendedor ?? null };
}

export async function obtenerPagosLeadVendedor(accessToken: string, leadId: string): Promise<PagoMp[]> {
  const respuesta = await fetch(`${API_URL}/api/vendedor/me/leads/${leadId}/pagos`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!respuesta.ok) {
    const cuerpo = (await respuesta.json().catch(() => ({ ok: false, error: 'network' }))) as ErrorApi;
    throw new ApiError(cuerpo, respuesta.status);
  }
  const data = (await respuesta.json()) as { ok: true; pagos: PagoMp[] };
  return data.pagos;
}
