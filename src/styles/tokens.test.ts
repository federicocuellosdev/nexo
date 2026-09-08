import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tokens = readFileSync(join(__dirname, './tokens.css'), 'utf8');

const REQUERIDOS = [
  '--font-sans',
  '--font-display',
  '--text-xs',
  '--text-3xl',
  '--color-marca-500',
  '--color-marca-700',
  '--color-acento-500',
  '--color-durazno-500',
  '--color-ink-50',
  '--color-ink-950',
  '--color-app',
  '--color-ok-700',
  '--color-warn-700',
  '--color-danger-700',
  '--radius-card',
  '--radius-campo',
  '--radius-pill',
  '--shadow-suave',
  '--shadow-card',
  '--shadow-elevada',
  '--shadow-flotante',
  '--ease-out-expo',
  '--ease-out-quart',
];

test.each(REQUERIDOS)('tokens.css declara %s', (token) => {
  expect(tokens).toContain(`${token}:`);
});

test('la paleta de marca conserva los valores heredados de Nexo 2.0', () => {
  expect(tokens).toContain('--color-marca-500: #8660ef');
  expect(tokens).toContain('--color-acento-500: #ee5cd0');
  expect(tokens).toContain('--color-durazno-500: #e5ab9f');
});

test('el fondo de aplicación es el definido en el spec §7', () => {
  expect(tokens).toContain('--color-app: #f6f5fb');
});

test('el degradado de marca existe como utilidad acotada, no como color de fondo suelto', () => {
  expect(tokens).toContain('@utility bg-brand');
  expect(tokens).toContain('linear-gradient(135deg, #8660ef 0%, #ee5cd0 100%)');
});
