import { createMemoryRouter, RouterProvider } from 'react-router';
import { act, render, screen } from '@testing-library/react';
import { AuthCallback } from '@/pages/AuthCallback';
import { getSession, resetSession } from '@/mock/session';

function montar(search: string) {
  const router = createMemoryRouter(
    [
      { path: '/auth/callback', element: <AuthCallback /> },
      { path: '/bienvenida', element: <p>pantalla de bienvenida</p> },
      { path: '/inicio', element: <p>pantalla de inicio</p> },
      { path: '/ingresar', element: <p>pantalla de ingreso</p> },
    ],
    { initialEntries: [`/auth/callback${search}`] },
  );
  return render(<RouterProvider router={router} />);
}

const ALTA =
  '?token=demo&intent=alta&tipo=plan&id=nexo-2' +
  '&nombre=Camila&apellido=P%C3%A9rez&email=camila.perez%40ejemplo.com&tel=3415551234';

beforeEach(() => {
  resetSession();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

async function avanzarLaValidacion() {
  await act(async () => {
    vi.advanceTimersByTime(600);
  });
}

test('mientras valida muestra el aviso de espera', () => {
  montar(ALTA);
  expect(screen.getByRole('status')).toHaveTextContent('Validando tu enlace');
});

test('un alta válida siembra usuario e intención y lleva a bienvenida', async () => {
  montar(ALTA);
  await avanzarLaValidacion();

  expect(screen.getByText('pantalla de bienvenida')).toBeInTheDocument();
  expect(getSession().usuario).toEqual({
    nombre: 'Camila',
    apellido: 'Pérez',
    email: 'camila.perez@ejemplo.com',
    telefono: '3415551234',
  });
  expect(getSession().intent).toEqual({ tipo: 'plan', id: 'nexo-2' });
});

test('un login válido siembra el usuario con el email y lleva al inicio', async () => {
  montar('?token=demo&intent=login&email=camila.perez%40ejemplo.com');
  await avanzarLaValidacion();

  expect(screen.getByText('pantalla de inicio')).toBeInTheDocument();
  expect(getSession().usuario?.email).toBe('camila.perez@ejemplo.com');
  expect(getSession().intent).toBeUndefined();
});

test('un enlace inválido no siembra nada y lleva al ingreso', async () => {
  montar('?token=roto&intent=login&email=a%40b.com');
  await avanzarLaValidacion();

  expect(screen.getByText('pantalla de ingreso')).toBeInTheDocument();
  expect(getSession().usuario).toBeUndefined();
});

test('un login de alguien que ya tenía sesión conserva su nombre real', async () => {
  montar(ALTA);
  await avanzarLaValidacion();

  montar('?token=demo&intent=login&email=camila.perez%40ejemplo.com');
  await avanzarLaValidacion();

  expect(getSession().usuario?.nombre).toBe('Camila');
});
