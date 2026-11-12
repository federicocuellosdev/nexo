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
  /** Código corto del vendedor para incluir en el cuerpo del email — el
   *  vendedor lo necesita para compartir su URL de atribución. */
  codigo: string;
  /** URL pública completa del onboarding con el ref ya pegado (ej.
   *  https://nexo.previncasalud.com.ar/onboarding?ref=ABC123). */
  urlOnboarding: string;
}

export function asuntoVendedorBienvenida(): string {
  return 'Te damos la bienvenida al programa de ventas de Previnca Nexo';
}

export function htmlVendedorBienvenida({ nombre, magicLink, logoUrl, codigo, urlOnboarding }: DatosEmailVendedor): string {
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
  <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.5;">
    Tu cuenta de <strong>Previnca Nexo</strong> como vendedor ya está activa. Vas a poder usar tu panel para ver el dashboard, seguir tu negocio (leads y afiliados) y acceder al onboarding para dar de alta clientes nuevos.
  </p>
  <p style="margin:0 0 28px;color:#374151;font-size:15px;line-height:1.5;">
    Hacé clic en el botón para entrar al panel. El link es de un solo uso.
  </p>
  <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
    <tr><td style="border-radius:999px;background:#8660EF;">
      <a href="${magicLink}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:999px;">Ingresar al panel</a>
    </td></tr>
  </table>
  <p style="margin:0 0 12px;color:#6b7280;font-size:13px;line-height:1.5;">
    <strong>Tu URL para atribuir ventas:</strong><br/>
    <a href="${urlOnboarding}" style="color:#8660EF;text-decoration:none;">${urlOnboarding}</a>
  </p>
  <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">
    Cada alta que entre por esa URL queda registrada a tu nombre (código <strong>${codigo}</strong>).
  </p>
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
