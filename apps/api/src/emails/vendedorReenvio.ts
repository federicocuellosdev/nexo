/**
 * Email de reenvío de acceso al vendedor. Combina los datos actuales (para
 * que confirme que están OK) con un magic link nuevo de un solo uso. Lo usa
 * el admin desde la ficha del vendedor cuando tiene que volver a mandar
 * acceso (olvidó el link, cambió de dispositivo, etc).
 */
export interface DatosEmailReenvio {
  nombre: string;
  apellido: string;
  email: string;
  dni: string | null;
  telefono: string | null;
  etiqueta: string | null;
  magicLink: string;
  logoUrl: string;
}

export function asuntoVendedorReenvio(): string {
  return 'Tu acceso como vendedor de Nexo';
}

function fila(etiqueta: string, valor: string | null): string {
  const texto = (valor ?? '').trim() === '' ? '—' : (valor as string);
  return `<tr>
    <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;width:140px;">${etiqueta}</td>
    <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;">${texto}</td>
  </tr>`;
}

export function htmlVendedorReenvio({
  nombre,
  apellido,
  email,
  dni,
  telefono,
  etiqueta,
  magicLink,
  logoUrl,
}: DatosEmailReenvio): string {
  const primerNombre = (nombre ?? '').trim().split(/\s+/)[0] ?? '';
  const saludo = primerNombre ? `Hola, ${primerNombre}` : 'Hola';

  return `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td align="left" style="background:#8660EF;padding:24px 36px;">
  <img src="${logoUrl}" alt="Nexo" width="66" height="22" style="display:block;height:22px;width:auto;border:0;outline:0;" />
</td></tr>
<tr><td style="padding:36px 36px 28px;">
  <h1 style="margin:0 0 16px;font-family:'DM Serif Display',Georgia,'Times New Roman',serif;font-style:italic;font-weight:400;font-size:26px;line-height:1.2;color:#111827;">${saludo}</h1>
  <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.5;">
    Te reenviamos el acceso al panel de <strong>Nexo</strong>. Primero revisá que tus datos sean correctos:
  </p>
  <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 24px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
    ${fila('Nombre', nombre)}
    ${fila('Apellido', apellido)}
    ${fila('Email', email)}
    ${fila('DNI', dni)}
    ${fila('Teléfono', telefono)}
    ${fila('Etiqueta', etiqueta)}
  </table>
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
