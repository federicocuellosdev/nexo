import { LOGO_DATA_URI } from './logo.js';

/**
 * Email de verificación de dirección. Un único propósito: que el usuario
 * confirme que el email es suyo haciendo click en el link. Sin copy comercial
 * ni detalle del plan — ese contenido vive en el landing / portal. Un email
 * de validación corto se lee mejor en la preview del inbox y tiene mejor
 * open-rate que uno tipo newsletter.
 */
export interface DatosEmailBienvenida {
  nombre: string;
  magicLink: string;
  /** Mantenemos el shape por compatibilidad con el caller, aunque ya no se usa en el cuerpo. */
  nombrePlan: string;
}

export function asuntoBienvenida(): string {
  return 'Verificá tu email';
}

export function htmlBienvenida({ nombre, magicLink }: DatosEmailBienvenida): string {
  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
<tr><td align="center">
<table width="440" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td align="left" style="background:#8660EF;padding:24px 36px;">
  <img src="${LOGO_DATA_URI}" alt="Nexo" width="66" height="22" style="display:block;height:22px;width:auto;border:0;outline:0;" />
</td></tr>
<tr><td style="padding:36px 36px 32px;">
  <h1 style="margin:0 0 20px;font-family:'DM Serif Display',Georgia,'Times New Roman',serif;font-style:italic;font-weight:400;font-size:28px;line-height:1.2;color:#111827;">Hola ${nombre}</h1>
  <p style="margin:0 0 28px;color:#374151;font-size:15px;line-height:1.5;">Hacé clic en el botón para confirmar esta dirección de email y activar tu cuenta.</p>
  <a href="${magicLink}" style="display:inline-block;background:#8660EF;color:#ffffff;padding:13px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Verificar email</a>
  <div style="margin:28px 0 0;border-top:1px solid #f3f4f6;"></div>
  <p style="margin:16px 0 0;font-size:13px;color:#9ca3af;line-height:1.5;">El enlace vence en 24 horas.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
