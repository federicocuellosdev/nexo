import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Logo oficial de Nexo como data URI. Lo embebemos inline en el HTML del
 * email para que no dependa de ninguna URL externa: así se ve igual en dev
 * (donde el server no es público) que en prod, y en cualquier cliente de
 * email (Gmail web, Apple Mail, Outlook, etc.).
 *
 * El PNG es RGBA con fondo transparente y la letra blanca: queda listo para
 * ponerse sobre cualquier color de fondo del banner.
 */
function cargarLogoBase64(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const path = join(here, 'assets', 'logo-nexo.png');
  const buffer = readFileSync(path);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

export const LOGO_DATA_URI = cargarLogoBase64();
