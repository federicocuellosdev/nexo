import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Los datos de planes están duplicados a propósito (spec §2), pero duplicado no
 * quiere decir divergente: si alguien toca un precio en una sola app, el
 * comparador y el pago mostrarían números distintos. Este test lo atrapa.
 */
test('mock/planes.ts es idéntico al de la landing', () => {
  const aqui = readFileSync(join(__dirname, './planes.ts'), 'utf8');
  const alla = readFileSync(join(__dirname, '../../../landing/src/mock/planes.ts'), 'utf8');
  expect(aqui).toBe(alla);
});
