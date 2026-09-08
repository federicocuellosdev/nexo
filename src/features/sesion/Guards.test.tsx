import { beforeEach } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen } from '@testing-library/react';
import { RequiereIntent, RequierePago, RequiereUsuario } from '@/features/sesion/Guards';
import { agregarOrden, resetSession, seedDemo, setSession } from '@/mock/session';
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
      {
        path: '/perfil/completar',
        element: (
          <RequierePago>
            <p>wizard de perfil</p>
          </RequierePago>
        ),
      },
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

test('perfil/completar sin usuario manda a ingresar', () => {
  montar('/perfil/completar');
  expect(screen.getByText('pantalla de ingreso')).toBeInTheDocument();
});

test('perfil/completar con conCuentaSinPago manda al inicio, no muestra el wizard', () => {
  setSession({ usuario: USUARIO_DEMO, intent: { tipo: 'plan', id: 'nexo-2' } });
  montar('/perfil/completar');
  expect(screen.queryByText('wizard de perfil')).not.toBeInTheDocument();
  expect(screen.getByText('pantalla de inicio')).toBeInTheDocument();
});

test('perfil/completar con pagadoSinPerfil deja entrar', () => {
  setSession({ usuario: USUARIO_DEMO, intent: { tipo: 'plan', id: 'nexo-2' } });
  agregarOrden({
    id: 'ord-pago-1',
    fecha: '2026-09-01',
    tipo: 'plan',
    itemId: 'nexo-2',
    concepto: 'Nexo II · cuota mensual',
    monto: 12000,
    estado: 'pagada',
  });
  montar('/perfil/completar');
  expect(screen.getByText('wizard de perfil')).toBeInTheDocument();
});

/*
 * El guard corta por FALTA DE PAGO, no por estar exactamente en
 * `pagadoSinPerfil`. Con estado `activo` deja pasar a propósito: al guardar el
 * perfil la sesión pasa a `activo` en el mismo tick, y un guard más estricto se
 * dispararía justo ahí, expulsando al usuario con su propio Navigate —sin el
 * `state` del aviso— en el momento en que termina el trámite bien. Editar el
 * perfil ya completo es tarea de /cuenta, no un agujero de seguridad.
 */
test('perfil/completar con estado activo deja pasar, porque ya pagó', () => {
  seedDemo('activo');
  montar('/perfil/completar');
  expect(screen.getByText('wizard de perfil')).toBeInTheDocument();
});
