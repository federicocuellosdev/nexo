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
