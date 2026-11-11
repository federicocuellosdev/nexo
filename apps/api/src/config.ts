import 'dotenv/config';

/**
 * Lectura centralizada de las variables de entorno. Falla al arrancar si
 * falta alguna crítica para evitar errores difusos en runtime (ej. un POST
 * que falla por un service_role vacío sin pistas en el log).
 */
function requerido(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre} (ver .env.example)`);
  return valor;
}

function opcional(nombre: string, porDefecto: string): string {
  return process.env[nombre] ?? porDefecto;
}

export const config = {
  puerto: Number.parseInt(opcional('PORT', '4000'), 10),
  corsOrigins: opcional('CORS_ORIGINS', 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  supabaseUrl: requerido('SUPABASE_URL'),
  supabaseServiceRoleKey: requerido('SUPABASE_SERVICE_ROLE_KEY'),
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  resendFrom: opcional('RESEND_FROM', 'Previnca Nexo <onboarding@resend.dev>'),
  // URL del portal privado (donde vive /inicio, /cuenta, /admin/*).
  //  - dev local standalone: http://localhost:5174
  //  - deploy unificado (landing+portal en un dominio): https://<host>/app
  //  - deploy split: https://<portal-host>
  portalUrl: opcional('PORTAL_URL', 'http://localhost:5174'),
  // URL del landing público (donde vive /catalogo, /contratar/*).
  //  - dev local standalone: http://localhost:5173
  //  - deploy unificado: https://<host>  (mismo origen que portalUrl sin /app)
  //  - deploy split: https://<landing-host>
  // Antes se derivaba del portalUrl recortando /app — ahora es explícito para
  // que un deploy split (portal y landing en dominios distintos) no requiera
  // tocar código.
  landingUrl: opcional('LANDING_URL', 'http://localhost:5173'),
  // URL pública del PNG del logo que aparece en el banner del email. Gmail
  // bloquea data URIs por privacidad: se hospeda en el front y se linkea
  // por URL. Por defecto apunta al landing local.
  emailLogoUrl: opcional('EMAIL_LOGO_URL', 'http://localhost:5173/logo-nexo-email.png'),
  // Salesforce: todo el flujo /leads se arma igual que en prod, pero el POST
  // real está detrás del flag. Mientras esté en `false` devuelve un sfLeadId
  // mock y loguea el payload.
  sf: {
    enabled: opcional('SF_ENABLED', 'false').toLowerCase() === 'true',
    tokenUrl: process.env.SF_TOKEN_URL ?? '',
    instanceUrl: process.env.SF_INSTANCE_URL ?? '',
    clientId: process.env.SF_CLIENT_ID ?? '',
    clientSecret: process.env.SF_CLIENT_SECRET ?? '',
  },
  // MercadoPago: el access token del vendedor (test o prod) para llamar al
  // endpoint /preapproval. Sin esto, /api/subscriptions responde 503 y el
  // portal cae al flujo mock de /pago.
  mp: {
    accessToken: process.env.MP_ACCESS_TOKEN ?? '',
    webhookSecret: process.env.MP_WEBHOOK_SECRET ?? '',
  },
} as const;
