// @ts-check
import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Copia el build del portal a `apps/landing/dist/app/`. En el deploy unificado
 * de Vercel (nexo-front), el portal se sirve como subpath `/app/*` del mismo
 * dominio que la landing — por eso se buildea con `VITE_BASE=/app/` y sus
 * archivos quedan debajo de la carpeta `app/` del output final.
 *
 * Se hace con un script Node.js (y no un `cp -r` en shell) para que funcione
 * igual en CI Linux (Vercel) y en Windows local.
 */
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origen = resolve(raiz, 'apps/portal/dist');
const destino = resolve(raiz, 'apps/landing/dist/app');

if (!existsSync(origen)) {
  console.error(`[copiar-portal] no existe ${origen} — ¿corriste el build del portal?`);
  process.exit(1);
}

rmSync(destino, { recursive: true, force: true });
mkdirSync(destino, { recursive: true });
cpSync(origen, destino, { recursive: true });
console.log(`[copiar-portal] copiado ${origen} → ${destino}`);
