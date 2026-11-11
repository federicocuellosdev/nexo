/**
 * Email transaccional usado en dos contextos:
 *   1. Alta (POST /leads desde /contratar u /onboarding): bienvenida + CTA
 *      para entrar al portal privado y seguir el proceso (pago, perfil).
 *   2. Login (POST /auth/magic-link desde /ingresar): verificación del email
 *      para re-abrir la sesión.
 *
 * Diferenciamos por presencia de `nombrePlan`: si viene con el nombre del
 * plan contratado es alta; si es string vacío, es login.
 */
export interface DatosEmailBienvenida {
  nombre: string;
  magicLink: string;
  /** URL pública del PNG del logo. Gmail bloquea los `src="data:..."` inline,
   *  por eso hosteamos el PNG en el front y lo linkeamos por URL. */
  logoUrl: string;
  /** Nombre del plan contratado. Vacío ('') cuando es un login puro — el
   *  template alterna la copy según este flag. */
  nombrePlan: string;
}

export function asuntoBienvenida(nombrePlan = ''): string {
  return nombrePlan.trim().length > 0 ? `Bienvenido a ${nombrePlan.trim()}` : 'Verificá tu email';
}

export function htmlBienvenida({ nombre, magicLink, logoUrl, nombrePlan }: DatosEmailBienvenida): string {
  // Primer nombre solamente (antes del primer espacio): "Federico Cuellos"
  // en la DB queda como "Federico" en el saludo del email. Si no hay nombre,
  // cae a "Hola" sin trailing space para no dejar el último carácter colgado.
  const primerNombre = (nombre ?? '').trim().split(/\s+/)[0] ?? '';
  const saludo = primerNombre ? `Hola, ${primerNombre}` : 'Hola';
  const esAlta = nombrePlan.trim().length > 0;

  const cuerpo = esAlta
    ? `Te damos la bienvenida a <strong>${nombrePlan.trim()}</strong>. Entrá al portal para seguir el proceso de alta y gestionar tu cobertura.`
    : 'Hacé clic en el botón para confirmar esta dirección de email y entrar al portal.';
  const cta = esAlta ? 'Ingresar al portal' : 'Verificar email';

  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
<tr><td align="center">
<table width="440" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td align="left" style="background:#8660EF;padding:24px 36px;">
  <img src="${logoUrl}" alt="Nexo" width="66" height="22" style="display:block;height:22px;width:auto;border:0;outline:0;" />
</td></tr>
<tr><td style="padding:36px 36px 32px;">
  <h1 style="margin:0 0 20px;font-family:'DM Serif Display',Georgia,'Times New Roman',serif;font-style:italic;font-weight:400;font-size:28px;line-height:1.2;color:#111827;">${saludo}</h1>
  <p style="margin:0 0 28px;color:#374151;font-size:15px;line-height:1.5;">${cuerpo}</p>
  <a href="${magicLink}" style="display:inline-block;background:#8660EF;color:#ffffff;padding:13px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">${cta}</a>
  <div style="margin:28px 0 0;border-top:1px solid #f3f4f6;"></div>
  <p style="margin:16px 0 0;font-size:13px;color:#9ca3af;line-height:1.5;">El enlace vence en 24 horas.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
