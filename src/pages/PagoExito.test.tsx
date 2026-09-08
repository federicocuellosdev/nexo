import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen } from '@testing-library/react';
import { rutas } from '@/router';
import { resetSession, setSession } from '@/mock/session';
import { PERFIL_DEMO, USUARIO_DEMO } from '@/mock/usuarios';

function montar() {
  const router = createMemoryRouter(rutas, { initialEntries: ['/pago/exito'] });
  return render(<RouterProvider router={router} />);
}

beforeEach(() => {
  resetSession();
});

test('agradece el pago y pide completar el perfil', () => {
  setSession({ usuario: USUARIO_DEMO });
  montar();
  expect(screen.getByRole('heading', { name: '¡Gracias por tu pago!' })).toBeInTheDocument();
  expect(screen.getByText(/completá tu perfil/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Completar perfil' })).toHaveAttribute('href', '/perfil/completar');
});

test('deja ir al inicio sin completar el perfil', () => {
  setSession({ usuario: USUARIO_DEMO });
  montar();
  expect(screen.getByRole('link', { name: 'Ir al inicio' })).toHaveAttribute('href', '/inicio');
});

test('con el perfil ya completo no vuelve a pedirlo', () => {
  setSession({ usuario: USUARIO_DEMO, perfil: PERFIL_DEMO });
  montar();
  expect(screen.queryByRole('link', { name: 'Completar perfil' })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Ir al inicio' })).toBeInTheDocument();
});
