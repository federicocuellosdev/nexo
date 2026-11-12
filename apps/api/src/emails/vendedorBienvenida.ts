/**
 * Email de bienvenida para un vendedor recién dado de alta. Explica cómo
 * accede al panel con el magic link y qué va a encontrar adentro (dashboard,
 * negocio, onboarding). El link apunta al portal, Supabase resuelve el
 * magic link y redirige a `/vendedor/dashboard`.
 */
export interface DatosEmailVendedor {
  nombre: string;
  magicLink: string;
  logoUrl: string;
}

export function asuntoVendedorBienvenida(): string {
  return 'Tu acceso como vendedor de Nexo';
}

export function htmlVendedorBienvenida({ nombre, magicLink, logoUrl }: DatosEmailVendedor): string {
  const primerNombre = (nombre ?? '').trim().split(/\s+/)[0] ?? '';
  const saludo = primerNombre ? `Hola, ${primerNombre}` : 'Hola';

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
  <p style="margin:0 0 28px;color:#374151;font-size:15px;line-height:1.5;">
    Tu cuenta de <strong>Nexo</strong> como vendedor ya está activa. Vas a poder usar tu panel para ver el dashboard, seguir tu negocio (leads y afiliados) y acceder al onboarding para dar de alta clientes nuevos.
  </p>
  <table cellpadding="0" cellspacing="0" style="margin:0;">
    <tr><td style="border-radius:999px;background:#8660EF;">
      <a href="${magicLink}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:999px;">Ingresar al panel</a>
    </td></tr>
  </table>
</td></tr>
<tr><td style="background:#f9fafb;padding:16px 36px;border-top:1px solid #e5e7eb;">
  <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">Previnca Salud · Si no esperabas este email, ignoralo.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
