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
  telefono: string;
  dni: string;
  /** true = no mandar a Salesforce. Lo usa /onboarding mientras la
   *  integración con SF esté en pruebas. */
  skipSf?: boolean;
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

// ───────────────────── /onboarding (vendedores en calle) ─────────────────────
// El wizard de /onboarding encadena 3 endpoints existentes:
//   1. POST /api/leads               → crea lead + envía magic link al cliente
//   2. POST /api/leads/:id/perfil    → persiste perfil completo
//   3. POST /api/subscriptions       → crea preapproval en MP, devuelve init_point
// El vendedor muestra el init_point al cliente (QR o link) para que pague.

export interface BeneficiarioOnboarding {
  nombre: string;
  apellido: string;
  tipoDocumento: 'DNI' | 'Pasaporte';
  numeroDocumento: string;
  sexo: 'F' | 'M' | 'X';
  fechaNacimiento: string;
  relacion: 'conyuge' | 'hijo' | 'padre' | 'madre' | 'otro';
}

export interface PayloadPerfilOnboarding {
  perfil: {
    tipoDocumento: 'DNI' | 'Pasaporte';
    numeroDocumento: string;
    sexo: 'F' | 'M' | 'X';
    fechaNacimiento: string; // YYYY-MM-DD
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
  beneficiarios: BeneficiarioOnboarding[];
  familiaresCount: number;
}

export async function guardarPerfilOnboarding(leadId: string, payload: PayloadPerfilOnboarding): Promise<void> {
  const res = await fetch(`${API_URL}/api/leads/${leadId}/perfil`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const cuerpo = (await res.json().catch(() => ({ ok: false, error: 'network' }))) as ErrorApi;
    throw new ApiError(cuerpo, res.status);
  }
}

export interface RespuestaSuscripcion {
  preapprovalId: string;
  initPoint: string;
}

export async function crearSuscripcionOnboarding(payload: {
  planId: string;
  planNombre: string;
  monto: number;
  emailMp: string;
  leadId: string;
}): Promise<RespuestaSuscripcion> {
  const res = await fetch(`${API_URL}/api/subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const cuerpo = (await res.json().catch(() => ({ ok: false, error: 'network' }))) as ErrorApi;
    throw new ApiError(cuerpo, res.status);
  }
  const data = (await res.json()) as { ok: true } & RespuestaSuscripcion;
  return { preapprovalId: data.preapprovalId, initPoint: data.initPoint };
}
