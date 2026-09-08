import { landingUrl } from '@/lib/urls';

test('usa el default de desarrollo cuando no hay variable de entorno', () => {
  expect(landingUrl()).toBe('http://localhost:5173');
});

test('usa VITE_LANDING_URL cuando está definida', () => {
  vi.stubEnv('VITE_LANDING_URL', 'https://nexo.test');
  expect(landingUrl()).toBe('https://nexo.test');
});

test('saca la barra final para que las rutas no queden con doble barra', () => {
  vi.stubEnv('VITE_LANDING_URL', 'https://nexo.test/');
  expect(landingUrl()).toBe('https://nexo.test');
});

test('ignora una variable vacía y vuelve al default', () => {
  vi.stubEnv('VITE_LANDING_URL', '');
  expect(landingUrl()).toBe('http://localhost:5173');
});
