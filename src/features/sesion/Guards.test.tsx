import { beforeEach } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen } from '@testing-library/react';
import { RequiereIntent, RequiereUsuario } from '@/features/sesion/Guards';
import { resetSession, setSession } from '@/mock/session';
import { USUARIO_DEMO } from '@/mock/usuarios';

// P-4: la sesión es un singleton en memoria que `test/setup.ts` no limpia
// (solo limpia localStorage). Sin este reset, `setSession` de un test
// contamina el siguiente.
beforeEach(() => {
  resetSession();
});

function montar(ruta: string) {
  const router = createMemoryRouter(
    [
      { path: '/privado', element: <RequiereUsuario><p>zona privada</p></RequiereUsuario> },
      { path: '/bienvenida', element: <RequiereIntent><p>bienvenida</p></RequiereIntent> },
      { path: '/ingresar', element: <p>pantalla de ingreso</p> },
      { path: '/inicio', element: <p>pantalla de inicio</p> },
    ],
    { initialEntries: [ruta] },
  );
  return render(<RouterProvider router={router} />);
}

test('sin usuario la zona privada manda a ingresar', () => {
  montar('/privado');
  expect(screen.getByText('pantalla de ingreso')).toBeInTheDocument();
});

test('con usuario la zona privada se muestra', () => {
  setSession({ usuario: USUARIO_DEMO });
  montar('/privado');
  expect(screen.getByText('zona privada')).toBeInTheDocument();
});

test('bienvenida sin usuario manda a ingresar', () => {
  montar('/bienvenida');
  expect(screen.getByText('pantalla de ingreso')).toBeInTheDocument();
});

test('bienvenida con usuario pero sin intención manda al inicio', () => {
  setSession({ usuario: USUARIO_DEMO });
  montar('/bienvenida');
  expect(screen.getByText('pantalla de inicio')).toBeInTheDocument();
});

test('bienvenida con usuario e intención se muestra', () => {
  setSession({ usuario: USUARIO_DEMO, intent: { tipo: 'plan', id: 'nexo-2' } });
  montar('/bienvenida');
  expect(screen.getByText('bienvenida')).toBeInTheDocument();
});
