import type { InitialEntry } from 'react-router';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen } from '@testing-library/react';
import { rutas } from '@/router';
import { resetSession, seedDemo } from '@/mock/session';

function montar(entrada: InitialEntry) {
  const router = createMemoryRouter(rutas, { initialEntries: [entrada] });
  return render(<RouterProvider router={router} />);
}

beforeEach(() => {
  resetSession();
});

test('es pública: se llega sin sesión y sin que el guard redirija', () => {
  montar('/verificar/1547');
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
    'Verificación de credencial',
  );
});

test('sin sesión responde No encontrado', () => {
  montar('/verificar/1547');
  expect(screen.getByRole('heading', { name: 'No encontrado' })).toBeInTheDocument();
});

test('con el número correcto muestra la credencial', () => {
  seedDemo('activo');
  montar('/verificar/1547');
  expect(screen.getByText('Camila Pérez')).toBeInTheDocument();
  expect(screen.getByText('289000015470000')).toBeInTheDocument();
});

test('un número que no coincide no devuelve la credencial de otro', () => {
  seedDemo('activo');
  montar('/verificar/1548');
  // Comparación exacta: no alcanza con que haya UNA credencial activa.
  expect(screen.getByRole('heading', { name: 'No encontrado' })).toBeInTheDocument();
  expect(screen.queryByText('Camila Pérez')).not.toBeInTheDocument();
});

test('avisa que es una simulación sin base de datos', () => {
  seedDemo('activo');
  montar('/verificar/1547');
  expect(screen.getByRole('note')).toHaveTextContent('Simulación');
});

test('no muestra la navegación del portal', () => {
  seedDemo('activo');
  montar('/verificar/1547');
  // Quien escanea el QR es una farmacia, no el socio: no tiene por qué ver
  // —ni poder tocar— el sidebar del portal de otra persona.
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
});
