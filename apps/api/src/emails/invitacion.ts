/**
 * Email de invitación al programa de referidos. Un afiliado invita a un amigo
 * por email; el link lleva directo al catálogo público de la landing, donde
 * el invitado ve los planes y puede contratar. No hay magic link ni token
 * acá: la invitación es solo una puerta de entrada, no da acceso a nada
 * hasta que el invitado complete su propio alta.
 */
export interface DatosEmailInvitacion {
  /** Nombre (primer nombre) del que invita. Vacío = saludo genérico. */
  referidorNombre: string;
  /** URL del catálogo público (con subpath /catalogo). */
  catalogoUrl: string;
  /** PNG público del logo (ver bienvenida.ts para el motivo). */
  logoUrl: string;
}

export function asuntoInvitacion(referidorNombre: string): string {
  const primer = (referidorNombre ?? '').trim().split(/\s+/)[0] ?? '';
  return primer ? `${primer} te invita a Nexo` : 'Alguien te invita a Nexo';
}

export function htmlInvitacion({
  referidorNombre,
  catalogoUrl,
  logoUrl,
}: DatosEmailInvitacion): string {
  const primer = (referidorNombre ?? '').trim().split(/\s+/)[0] ?? '';
  const titulo = primer ? `${primer} te quiere en Nexo` : 'Te invitan a Nexo';
  // Mismo tratamiento visual que bienvenida.ts (header violeta con logo +
  // tarjeta blanca abajo) para que el dueño del inbox reconozca el remitente
  // aunque sea la primera vez que lo recibe.
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
  <h1 style="margin:0 0 20px;font-family:'DM Serif Display',Georgia,'Times New Roman',serif;font-style:italic;font-weight:400;font-size:28px;line-height:1.2;color:#111827;">${titulo}</h1>
  <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.5;">Nexo es la cobertura mensual de Previnca: medicina + óptica + farmacia en un solo plan, sin trámites.</p>
  <p style="margin:0 0 28px;color:#374151;font-size:15px;line-height:1.5;">Mirá los planes disponibles y elegí el que te sirva.</p>
  <a href="${catalogoUrl}" style="display:inline-block;background:#8660EF;color:#ffffff;padding:13px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Ver planes</a>
  <div style="margin:28px 0 0;border-top:1px solid #f3f4f6;"></div>
  <p style="margin:16px 0 0;font-size:13px;color:#9ca3af;line-height:1.5;">Si no conocés a ${primer || 'quien te invitó'}, podés ignorar este email.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
