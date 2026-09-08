import { beforeEach } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PortalLayout } from '@/layouts/PortalLayout';
import { getSession, resetSession, setSession } from '@/mock/session';
import { USUARIO_DEMO } from '@/mock/usuarios';

// P-4: cada test siembra su propia sesión con `setSession`, que hace un
// merge superficial sobre el singleton en memoria (no lo reemplaza). Sin
// este reset, campos sembrados por un test (p. ej. `intent`) sobreviven al
// siguiente test dentro del mismo archivo.
beforeEach(() => {
  resetSession();
});

function montar(ruta = '/inicio') {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <PortalLayout />,
        children: [
          { path: 'inicio', element: <p>contenido de inicio</p> },
          { path: 'cuenta', element: <p>contenido de cuenta</p> },
        ],
      },
    ],
    { initialEntries: [ruta] },
  );
  return render(<RouterProvider router={router} />);
}

test('renderiza el contenido de la ruta hija', () => {
  setSession({ usuario: USUARIO_DEMO });
  montar();
  expect(screen.getByText('contenido de inicio')).toBeInTheDocument();
});

test('hay dos navegaciones: la de mobile y la de escritorio', () => {
  setSession({ usuario: USUARIO_DEMO });
  montar();
  expect(screen.getAllByRole('navigation', { name: 'Navegación principal' })).toHaveLength(2);
});

test('las cinco secciones del portal están en la navegación', () => {
  setSession({ usuario: USUARIO_DEMO });
  montar();
  for (const etiqueta of ['Inicio', 'Planes', 'Coberturas', 'Movimientos', 'Cuenta']) {
    expect(screen.getAllByRole('link', { name: etiqueta }).length).toBeGreaterThan(0);
  }
});

test('la ruta activa se marca con aria-current en las dos navegaciones', () => {
  setSession({ usuario: USUARIO_DEMO });
  montar('/cuenta');
  const activos = screen.getAllByRole('link', { name: 'Cuenta' });
  expect(activos).toHaveLength(2);
  for (const enlace of activos) expect(enlace).toHaveAttribute('aria-current', 'page');
});

test('el avatar muestra las iniciales del usuario', () => {
  setSession({ usuario: USUARIO_DEMO });
  montar();
  expect(screen.getByText('CP')).toBeInTheDocument();
});

test('cerrar sesión limpia la sesión y apunta a la landing', async () => {
  const usuario = userEvent.setup();
  setSession({ usuario: USUARIO_DEMO });
  montar();

  const salir = screen.getByRole('link', { name: 'Cerrar sesión' });
  expect(salir).toHaveAttribute('href', 'http://localhost:5173');
  await usuario.click(salir);
  expect(getSession().usuario).toBeUndefined();
});

test('el enlace Ver catálogo lleva a la landing', () => {
  setSession({ usuario: USUARIO_DEMO });
  montar();
  expect(screen.getByRole('link', { name: 'Ver catálogo' })).toHaveAttribute('href', 'http://localhost:5173');
});
