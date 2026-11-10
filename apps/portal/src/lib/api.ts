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
    tieneObraSocial: boolean;
    obraSocial?: string;
    tipoContratacion: 'beneficiario' | 'tomador' | 'tomador-beneficiario';
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
