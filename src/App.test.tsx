import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen } from '@testing-library/react';
import { rutas } from '@/router';

test('sin sesión el portal aterriza en el ingreso', () => {
  const router = createMemoryRouter(rutas, { initialEntries: ['/ingresar'] });
  render(<RouterProvider router={router} />);
  expect(screen.getByRole('heading', { level: 1, name: 'Ingresá a tu portal' })).toBeInTheDocument();
});
