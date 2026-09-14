import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rutas } from '@/router';
import { agregarOrden, getSession, resetSession, seedDemo, setSession } from '@/mock/session';
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

test('el plan que ya tenés no se puede volver a contratar y los otros ofrecen cambiar', () => {
  seedDemo('activo');
  montar();
  // El plan actual se comunica con la badge "Tu plan"; ofrecerle un CTA sería
  // invitarlo a recomprar lo mismo.
  expect(screen.getAllByRole('button', { name: 'Cambiar a este plan' })).toHaveLength(2);
  expect(screen.queryByRole('button', { name: 'Contratar' })).not.toBeInTheDocument();
});

test('sin plan contratado los tres ofrecen contratar', () => {
  setSession({ usuario: USUARIO_DEMO });
  montar();
  expect(screen.getAllByRole('button', { name: 'Contratar' })).toHaveLength(3);
  expect(screen.queryByRole('button', { name: 'Cambiar a este plan' })).not.toBeInTheDocument();
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

  // Ya tiene plan, así que los otros dos ofrecen cambiarse, no contratar.
  await usuario.click(screen.getAllByRole('button', { name: 'Cambiar a este plan' })[0]!);

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

test('un producto ya contratado se marca y no se puede volver a comprar', async () => {
  const usuario = userEvent.setup();
  seedDemo('activo');
  agregarOrden({
    id: 'ord-test-hogar',
    fecha: '2026-09-01',
    tipo: 'producto',
    itemId: 'hogar-1',
    concepto: 'Seguro de Hogar · cuota mensual',
    monto: 3500,
    estado: 'pagada',
  });
  montar();

  await usuario.click(screen.getByRole('tab', { name: 'Productos' }));

  const titulo = screen.getByRole('heading', { name: 'Seguro de Hogar · hasta 1er piso' });
  const tarjeta = titulo.closest('article')!;
  expect(within(tarjeta).getByText('Ya contratado')).toBeInTheDocument();
  expect(within(tarjeta).queryByRole('button', { name: 'Contratar' })).not.toBeInTheDocument();
  // El resto de los productos sigue disponible: el corte es por producto, no global.
  expect(screen.getAllByRole('button', { name: 'Contratar' }).length).toBeGreaterThan(0);
});
