import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rutas } from '@/router';
import { resetSession } from '@/mock/session';

function montar() {
  const router = createMemoryRouter(rutas, { initialEntries: ['/ingresar'] });
  return render(<RouterProvider router={router} />);
}

beforeEach(() => {
  resetSession();
});

test('pide el email', () => {
  montar();
  expect(screen.getByLabelText(/^Email/)).toBeInTheDocument();
});

test('el email es requerido y se anuncia como tal', () => {
  montar();
  expect(screen.getByLabelText(/^Email/)).toHaveAttribute('aria-required', 'true');
});

test('un email vacío muestra el error y no avanza', async () => {
  const usuario = userEvent.setup();
  montar();
  await usuario.click(screen.getByRole('button', { name: 'Enviarme el enlace' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Ingresá tu email');
  expect(screen.queryByRole('heading', { name: 'Revisá tu mail' })).not.toBeInTheDocument();
});

test('un email mal escrito muestra el error de formato', async () => {
  const usuario = userEvent.setup();
  montar();
  await usuario.type(screen.getByLabelText(/^Email/), 'camila.ejemplo.com');
  await usuario.click(screen.getByRole('button', { name: 'Enviarme el enlace' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Revisá el email: falta el @ o el dominio');
});

test('un email válido muestra la pantalla de revisá tu mail con el email destino', async () => {
  const usuario = userEvent.setup();
  montar();
  await usuario.type(screen.getByLabelText(/^Email/), 'camila.perez@ejemplo.com');
  await usuario.click(screen.getByRole('button', { name: 'Enviarme el enlace' }));

  expect(screen.getByRole('heading', { name: 'Revisá tu mail' })).toBeInTheDocument();
  expect(screen.getByText('camila.perez@ejemplo.com')).toBeInTheDocument();
});
