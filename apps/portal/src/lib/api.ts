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
  titular?: { nombre: string; apellido: string; dni?: string };
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
