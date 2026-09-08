import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rutas } from '@/router';
import { agregarOrden, resetSession, seedDemo, setSession } from '@/mock/session';
import { USUARIO_DEMO } from '@/mock/usuarios';

function montar() {
  const router = createMemoryRouter(rutas, { initialEntries: ['/movimientos'] });
  return render(<RouterProvider router={router} />);
}

beforeEach(() => {
  resetSession();
  seedDemo('activo');
  agregarOrden({
    id: 'ord-3000',
    fecha: '2026-09-02',
    tipo: 'producto',
    itemId: 'hogar-1',
    concepto: 'Seguro de Hogar · hasta 1er piso · cuota mensual',
    monto: 19000,
    estado: 'pagada',
  });
});

test('arranca mostrando todos los movimientos', () => {
  montar();
  const contenido = within(screen.getByRole('main'));
  expect(screen.getByRole('tab', { name: 'Todos' })).toHaveAttribute('aria-selected', 'true');
  expect(contenido.getAllByRole('listitem')).toHaveLength(3);
});

test('el filtro Pagos deja solo las cuotas del plan', async () => {
  const usuario = userEvent.setup();
  montar();
  const contenido = within(screen.getByRole('main'));
  await usuario.click(screen.getByRole('tab', { name: 'Pagos' }));
  expect(contenido.getAllByRole('listitem')).toHaveLength(2);
});

test('el filtro Contrataciones deja solo los productos', async () => {
  const usuario = userEvent.setup();
  montar();
  const contenido = within(screen.getByRole('main'));
  await usuario.click(screen.getByRole('tab', { name: 'Contrataciones' }));
  expect(contenido.getAllByRole('listitem')).toHaveLength(1);
  expect(screen.getByText('Seguro de Hogar · hasta 1er piso · cuota mensual')).toBeInTheDocument();
});

test('lista vacía conserva la jerarquía h1 → h2 → h3, sin salto', () => {
  resetSession();
  setSession({ usuario: USUARIO_DEMO, ordenes: [] });
  montar();

  expect(screen.getByRole('heading', { level: 1, name: 'Mis movimientos' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: 'Todos' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 3, name: 'Todavía no hay movimientos' })).toBeInTheDocument();
});
