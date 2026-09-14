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
          // Rutas de checkout, para verificar el modo enfocado. Se usan stubs
          // en vez de las pantallas reales: acá se prueba el LAYOUT, no ellas.
          { path: 'bienvenida', element: <p>contenido de bienvenida</p> },
          { path: 'pago', element: <p>contenido de pago</p> },
          { path: 'pago/exito', element: <p>contenido de pago exitoso</p> },
          { path: 'perfil/completar', element: <p>contenido de perfil</p> },
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

test('el avatar muestra las iniciales del usuario en la barra y en el sidebar', () => {
  setSession({ usuario: USUARIO_DEMO });
  montar();
  // Dos: el de la TopBar (mobile) y el del bloque de identidad del Sidebar
  // (escritorio). Sólo uno de los dos es visible a la vez según el ancho, pero
  // ambos están en el DOM porque el corte es por CSS, no por JS.
  expect(screen.getAllByText('CP')).toHaveLength(2);
});

test('el sidebar identifica de quién es la sesión y lleva a la cuenta', () => {
  setSession({ usuario: USUARIO_DEMO });
  montar();
  // El nombre completo sólo lo pinta el Sidebar; la TopBar muestra iniciales.
  expect(screen.getByText('Camila Pérez')).toBeInTheDocument();
  expect(screen.getByText('Ver mi cuenta')).toBeInTheDocument();
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

/* ── Modo enfocado en checkout ───────────────────────────────────────────── */

test.each(['/bienvenida', '/pago', '/perfil/completar'])(
  'en %s esconde la navegación: la pantalla tiene un solo trabajo',
  (ruta) => {
    setSession({ usuario: USUARIO_DEMO });
    montar(ruta);

    // Ni sidebar ni BottomNav: cada destino visible compite con el pago.
    expect(screen.queryByRole('navigation', { name: 'Navegación principal' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Coberturas' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Movimientos' })).not.toBeInTheDocument();
    // Tampoco las salidas del pie, que sacan del portal entero.
    expect(screen.queryByRole('link', { name: 'Ver catálogo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Cerrar sesión' })).not.toBeInTheDocument();
  },
);

test.each(['/bienvenida', '/pago', '/perfil/completar'])(
  'en %s el logo queda como salida: nadie debe quedar encerrado',
  (ruta) => {
    setSession({ usuario: USUARIO_DEMO });
    montar(ruta);
    // Sin sidebar ni BottomNav, quien entre directo necesita alguna forma de
    // irse que no sea terminar el trámite.
    expect(screen.getByRole('link', { name: 'Nexo — Previnca Salud' })).toHaveAttribute('href', '/inicio');
  },
);

// Son DOS: el Sidebar (escritorio) y la BottomNav (mobile) comparten el mismo
// `aria-label`. Ambas viven siempre en el DOM porque el corte es por CSS, no
// por JS, así que la cuenta correcta es 2 y no 1.
test('/pago/exito SÍ conserva la navegación: es la salida del checkout, no un paso', () => {
  setSession({ usuario: USUARIO_DEMO });
  montar('/pago/exito');
  expect(screen.getAllByRole('navigation', { name: 'Navegación principal' })).toHaveLength(2);
});

test('las pantallas normales conservan la navegación', () => {
  setSession({ usuario: USUARIO_DEMO });
  montar('/inicio');
  expect(screen.getAllByRole('navigation', { name: 'Navegación principal' })).toHaveLength(2);
});
