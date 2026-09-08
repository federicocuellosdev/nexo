import { portalUrl } from '@/lib/urls';

test('usa el default de desarrollo cuando no hay variable de entorno', () => {
  expect(portalUrl()).toBe('http://localhost:5174');
});

test('usa VITE_PORTAL_URL cuando está definida', () => {
  vi.stubEnv('VITE_PORTAL_URL', 'https://portal.nexo.test');
  expect(portalUrl()).toBe('https://portal.nexo.test');
});

test('saca la barra final para que las rutas no queden con doble barra', () => {
  vi.stubEnv('VITE_PORTAL_URL', 'https://portal.nexo.test/');
  expect(portalUrl()).toBe('https://portal.nexo.test');
});

test('ignora una variable vacía y vuelve al default', () => {
  vi.stubEnv('VITE_PORTAL_URL', '');
  expect(portalUrl()).toBe('http://localhost:5174');
});
