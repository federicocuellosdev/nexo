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
  const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => undefined);
  montar();
  await usuario.click(screen.getByRole('button', { name: 'Enviarme el enlace' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Ingresá tu email');
  expect(assign).not.toHaveBeenCalled();
  assign.mockRestore();
});

test('un email mal escrito muestra el error de formato', async () => {
  const usuario = userEvent.setup();
  montar();
  await usuario.type(screen.getByLabelText(/^Email/), 'camila.ejemplo.com');
  await usuario.click(screen.getByRole('button', { name: 'Enviarme el enlace' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Revisá el email: falta el @ o el dominio');
});

test('un email válido guarda handoff de login y redirige a /revisa-tu-mail', async () => {
  const usuario = userEvent.setup();
  const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => undefined);
  sessionStorage.clear();
  montar();
  await usuario.type(screen.getByLabelText(/^Email/), 'camila.perez@ejemplo.com');
  await usuario.click(screen.getByRole('button', { name: 'Enviarme el enlace' }));

  expect(assign).toHaveBeenCalledWith('http://localhost:5173/revisa-tu-mail');
  expect(JSON.parse(sessionStorage.getItem('nexo3.alta') ?? '{}')).toEqual({
    intent: 'login',
    email: 'camila.perez@ejemplo.com',
  });
  assign.mockRestore();
});
