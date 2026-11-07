/**
 * Cliente mínimo contra `apps/api`. Vive separado del AltaDialog para poder
 * tiparlo una vez y reutilizarlo cuando aparezcan más endpoints (reenvío
 * de magic link, PATCH de enrich, etc.).
 */
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export interface PayloadCrearLead {
  tipo: 'plan' | 'producto';
  itemId: string;
  itemNombre: string;
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
}

export interface RespuestaCrearLead {
  ok: true;
  leadId: string;
  sfLeadId: string | null;
  sfMock: boolean;
}

export interface ErrorApi {
  ok: false;
  error: string;
  detalles?: Record<string, string[] | undefined>;
  leadId?: string;
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

export async function crearLead(payload: PayloadCrearLead): Promise<RespuestaCrearLead> {
  const res = await fetch(`${API_URL}/api/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({ ok: false, error: 'invalid_json' }))) as
    | RespuestaCrearLead
    | ErrorApi;

  if (!res.ok || data.ok === false) {
    throw new ApiError(data as ErrorApi, res.status);
  }

  return data;
}
