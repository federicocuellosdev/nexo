/**
 * Email que se dispara cuando el admin edita los datos de un vendedor. El
 * cuerpo muestra todos los datos del vendedor en una tabla simple — es un
 * "acuse de recibo" para que el vendedor tenga por mail la última versión de
 * sus datos. Si el email cambió, este mail lo recibe el NUEVO email (el
 * anterior deja de estar ligado a la cuenta).
 */
export interface DatosEmailActualizado {
  nombre: string;
  apellido: string;
  email: string;
  dni: string | null;
  telefono: string | null;
  etiqueta: string | null;
  logoUrl: string;
}

export function asuntoVendedorActualizado(): string {
  return 'Actualizamos tus datos en Previnca Nexo';
}

function fila(etiqueta: string, valor: string | null): string {
  const texto = (valor ?? '').trim() === '' ? '—' : (valor as string);
  return `<tr>
    <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px;width:140px;">${etiqueta}</td>
    <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;">${texto}</td>
  </tr>`;
}

export function htmlVendedorActualizado({
  nombre,
  apellido,
  email,
  dni,
  telefono,
  etiqueta,
  logoUrl,
}: DatosEmailActualizado): string {
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
    Actualizamos tus datos en el programa de ventas de <strong>Previnca Nexo</strong>. Te dejamos cómo quedaron:
  </p>
  <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 24px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
    ${fila('Nombre', nombre)}
    ${fila('Apellido', apellido)}
    ${fila('Email', email)}
    ${fila('DNI', dni)}
    ${fila('Teléfono', telefono)}
    ${fila('Etiqueta', etiqueta)}
  </table>
  <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">
    Si alguno de estos datos no es correcto, respondé este mail y lo ajustamos.
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
