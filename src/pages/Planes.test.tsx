import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rutas } from '@/router';
import { getSession, resetSession, seedDemo, setSession } from '@/mock/session';
import { USUARIO_DEMO } from '@/mock/usuarios';

function montar() {
  const router = createMemoryRouter(rutas, { initialEntries: ['/planes'] });
  return render(<RouterProvider router={router} />);
}

beforeEach(() => {
  resetSession();
});

test('muestra los tres planes', () => {
  setSession({ usuario: USUARIO_DEMO });
  montar();
  expect(screen.getAllByRole('article')).toHaveLength(3);
});

test('marca el plan que ya tiene contratado', () => {
  seedDemo('activo');
  montar();
  expect(screen.getByText('Tu plan')).toBeInTheDocument();
});

test('el plan activo ofrece cambiar y los otros contratar', () => {
  seedDemo('activo');
  montar();
  expect(screen.getByRole('button', { name: 'Cambiar a este plan' })).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: 'Contratar' })).toHaveLength(2);
});

test('sin perfil completo elegir un plan guarda la intención y va a bienvenida', async () => {
  const usuario = userEvent.setup();
  setSession({ usuario: USUARIO_DEMO });
  montar();

  await usuario.click(screen.getAllByRole('button', { name: 'Contratar' })[0]!);

  expect(getSession().intent).toEqual({ tipo: 'plan', id: 'nexo-1' });
  expect(screen.getByRole('heading', { level: 1, name: /Hola, Camila/ })).toBeInTheDocument();
});

test('con perfil completo elegir un plan va directo al pago', async () => {
  const usuario = userEvent.setup();
  seedDemo('activo');
  montar();

  await usuario.click(screen.getAllByRole('button', { name: 'Contratar' })[0]!);

  expect(screen.getByText('Simulación — acá irá Mercado Pago')).toBeInTheDocument();
});

test('la pestaña Productos permite contratar un servicio on demand', async () => {
  const usuario = userEvent.setup();
  seedDemo('activo');
  montar();

  await usuario.click(screen.getByRole('tab', { name: 'Productos' }));
  await usuario.click(screen.getAllByRole('button', { name: 'Contratar' })[0]!);

  expect(getSession().intent).toEqual({ tipo: 'producto', id: 'salud-1' });
});
