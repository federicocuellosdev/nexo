import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rutas } from '@/router';
import { getSession, resetSession, seedDemo } from '@/mock/session';

function montar() {
  const router = createMemoryRouter(rutas, { initialEntries: ['/demo'] });
  return render(<RouterProvider router={router} />);
}

beforeEach(() => {
  resetSession();
});

test('se puede abrir sin sesión: es la pantalla de rescate de la presentación', () => {
  montar();
  expect(screen.getByRole('heading', { level: 1, name: 'Controles de demostración' })).toBeInTheDocument();
});

test('muestra el estado actual de la cuenta', () => {
  montar();
  expect(screen.getByText('sinCuenta')).toBeInTheDocument();
});

test('"Usuario nuevo con intención Nexo II" deja usuario e intención sin pago', async () => {
  const usuario = userEvent.setup();
  montar();
  await usuario.click(screen.getByRole('button', { name: 'Usuario nuevo con intención Nexo II' }));

  expect(getSession().intent).toEqual({ tipo: 'plan', id: 'nexo-2' });
  expect(getSession().ordenes).toEqual([]);
  expect(screen.getByText('conCuentaSinPago')).toBeInTheDocument();
});

test('"Usuario pagado sin perfil" deja el pago hecho pero el perfil sin completar', async () => {
  const usuario = userEvent.setup();
  montar();
  await usuario.click(screen.getByRole('button', { name: 'Usuario pagado sin perfil' }));

  expect(getSession().perfil).toBeUndefined();
  expect(getSession().ordenes.some((orden) => orden.estado === 'pagada')).toBe(true);
  expect(screen.getByText('pagadoSinPerfil')).toBeInTheDocument();
});

test('"Usuario con Nexo II activo" deja perfil y pago hechos', async () => {
  const usuario = userEvent.setup();
  montar();
  await usuario.click(screen.getByRole('button', { name: 'Usuario con Nexo II activo' }));

  expect(getSession().perfil).toBeDefined();
  expect(screen.getByText('activo')).toBeInTheDocument();
});

test('"Reiniciar" vacía la sesión', async () => {
  const usuario = userEvent.setup();
  seedDemo('activo');
  montar();
  await usuario.click(screen.getByRole('button', { name: 'Reiniciar' }));

  expect(getSession()).toEqual({ ordenes: [] });
  expect(screen.getByText('sinCuenta')).toBeInTheDocument();
});

test('ofrece atajos para saltar a las pantallas clave', () => {
  montar();
  expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/inicio');
  expect(screen.getByRole('link', { name: 'Bienvenida' })).toHaveAttribute('href', '/bienvenida');
  expect(screen.getByRole('link', { name: 'Completar perfil' })).toHaveAttribute('href', '/perfil/completar');
});
