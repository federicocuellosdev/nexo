import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rutas } from '@/router';
import { resetSession } from '@/mock/session';
import * as api from '@/lib/api';

function montar() {
  const router = createMemoryRouter(rutas, { initialEntries: ['/ingresar'] });
  return render(<RouterProvider router={router} />);
}

beforeEach(() => {
  resetSession();
  sessionStorage.clear();
  vi.spyOn(api, 'pedirMagicLink').mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
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

test('un email válido dispara el magic link, guarda handoff y redirige a /revisa-tu-mail', async () => {
  const usuario = userEvent.setup();
  const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => undefined);
  montar();
  await usuario.type(screen.getByLabelText(/^Email/), 'camila.perez@ejemplo.com');
  await usuario.click(screen.getByRole('button', { name: 'Enviarme el enlace' }));

  await waitFor(() => {
    expect(assign).toHaveBeenCalledWith('http://localhost:5173/revisa-tu-mail');
  });
  expect(api.pedirMagicLink).toHaveBeenCalledWith('camila.perez@ejemplo.com');
  expect(JSON.parse(sessionStorage.getItem('nexo3.alta') ?? '{}')).toEqual({
    intent: 'login',
    email: 'camila.perez@ejemplo.com',
  });
});

test('si el backend falla, muestra el error y no navega', async () => {
  const usuario = userEvent.setup();
  const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => undefined);
  vi.spyOn(api, 'pedirMagicLink').mockRejectedValue(new Error('network down'));
  montar();
  await usuario.type(screen.getByLabelText(/^Email/), 'camila.perez@ejemplo.com');
  await usuario.click(screen.getByRole('button', { name: 'Enviarme el enlace' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(/No pudimos enviar/);
  expect(assign).not.toHaveBeenCalled();
});
