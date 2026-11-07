import { config } from '@/config.js';

/**
 * Cliente HTTP para la API REST custom de Salesforce (`/services/apexrest/previnca/v1`).
 * Replica el patrón del portal v2 (`nexo-portal-v2/src/lib/salesforce/client.ts`):
 * OAuth 2.0 client_credentials con token cacheado en memoria del proceso.
 *
 * Mientras `config.sf.enabled` sea false, nunca se usa — el caller resuelve con
 * respuestas mock. Lo dejamos listo para que el día que se active, sea solo un
 * flip de flag + 4 env vars.
 */
interface TokenCache {
  accessToken: string;
  instanceUrl: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

export class SfNoConfiguradoError extends Error {
  constructor() {
    super('Salesforce no está habilitado (SF_ENABLED=false o faltan credenciales).');
    this.name = 'SfNoConfiguradoError';
  }
}

function assertConfigurado() {
  if (!config.sf.enabled) throw new SfNoConfiguradoError();
  const { tokenUrl, instanceUrl, clientId, clientSecret } = config.sf;
  if (!tokenUrl || !instanceUrl || !clientId || !clientSecret) {
    throw new Error('Salesforce env vars incompletas (ver .env.example)');
  }
}

/**
 * Devuelve un access token válido, refrescándolo si expiró (buffer de 60s).
 * OAuth client_credentials no da refresh_token — se pide uno nuevo cada vez.
 */
export async function getAccessToken(): Promise<{ accessToken: string; instanceUrl: string }> {
  assertConfigurado();

  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt - 60_000 > now) {
    return { accessToken: tokenCache.accessToken, instanceUrl: tokenCache.instanceUrl };
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: config.sf.clientId,
    client_secret: config.sf.clientSecret,
  });

  const res = await fetch(config.sf.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`SF token request failed: ${res.status} ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    instance_url?: string;
    expires_in?: number;
  };

  const expiresIn = data.expires_in ?? 1800;
  tokenCache = {
    accessToken: data.access_token,
    instanceUrl: data.instance_url ?? config.sf.instanceUrl,
    expiresAt: now + expiresIn * 1000,
  };

  return { accessToken: tokenCache.accessToken, instanceUrl: tokenCache.instanceUrl };
}

export interface SfResult<T> {
  ok: boolean;
  status: number;
  body: T | null;
  rawBody: unknown;
}

/**
 * POST a un endpoint del namespace `previnca/v1`. No reintenta: la política de
 * retry es del caller (idempotente vía `messageId`). Ante 5xx o network error
 * el caller puede reencolar con el mismo `messageId` y SF devuelve el mismo ack.
 */
export async function sfPost<T>(path: string, body: unknown): Promise<SfResult<T>> {
  assertConfigurado();

  const { accessToken, instanceUrl } = await getAccessToken();
  const url = `${instanceUrl.replace(/\/+$/, '')}/services/apexrest/previnca/v1${path}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let parsed: unknown = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    /* body no-JSON (raro); lo dejamos como texto para el log */
  }

  return {
    ok: res.ok,
    status: res.status,
    body: res.ok ? (parsed as T) : null,
    rawBody: parsed,
  };
}
