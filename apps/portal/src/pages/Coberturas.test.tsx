import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen, within } from '@testing-library/react';
import { rutas } from '@/router';
import { agregarOrden, resetSession, seedDemo, setSession } from '@/mock/session';
import { USUARIO_DEMO } from '@/mock/usuarios';

function montar() {
  const router = createMemoryRouter(rutas, { initialEntries: ['/coberturas'] });
  return render(<RouterProvider router={router} />);
}

beforeEach(() => {
  resetSession();
});

test('muestra el plan activo con todas sus prestaciones', () => {
  seedDemo('activo');
  montar();
  expect(screen.getByRole('heading', { level: 2, name: 'Nexo II' })).toBeInTheDocument();
  expect(screen.getByText('Seguro de Salud I')).toBeInTheDocument();
  expect(screen.getByText('Activa')).toBeInTheDocument();
});

test('explica cómo usar la óptica y la telemedicina', () => {
  seedDemo('activo');
  montar();
  const seccion = screen.getByRole('region', { name: 'Cómo usar tu cobertura' });
  expect(seccion).toHaveTextContent('Rosario Visión');
  expect(seccion).toHaveTextContent('Doc24');
});

test('sin perfil marca la cobertura como pendiente y ofrece completarlo', () => {
  setSession({ usuario: USUARIO_DEMO });
  agregarOrden({
    id: 'ord-9',
    fecha: '2026-09-01',
    tipo: 'plan',
    itemId: 'nexo-2',
    concepto: 'Nexo II · cuota mensual',
    monto: 12000,
    estado: 'pagada',
  });
  montar();
  expect(screen.getByText('Pendiente de activación')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Completar perfil' })).toHaveAttribute('href', '/perfil/completar');
});

test('lista los productos contratados', () => {
  seedDemo('activo');
  agregarOrden({
    id: 'ord-10',
    fecha: '2026-09-02',
    tipo: 'producto',
    itemId: 'hogar-1',
    concepto: 'Seguro de Hogar · hasta 1er piso · cuota mensual',
    monto: 19000,
    estado: 'pagada',
  });
  montar();
  const seccion = screen.getByRole('region', { name: 'Productos contratados' });
  expect(seccion).toHaveTextContent('Seguro de Hogar · hasta 1er piso');
});

test('marca con "a confirmar" un producto contratado con datos pendientes [ruling P-2]', () => {
  seedDemo('activo');
  agregarOrden({
    id: 'ord-11',
    fecha: '2026-09-03',
    tipo: 'producto',
    itemId: 'vida',
    concepto: 'Seguro de Vida · cuota mensual',
    monto: 2750,
    estado: 'pagada',
  });
  montar();
  const seccion = screen.getByRole('region', { name: 'Productos contratados' });
  expect(within(seccion).getByText('Seguro de Vida')).toBeInTheDocument();
  expect(within(seccion).getByText('a confirmar')).toBeInTheDocument();
});

test('sin nada contratado muestra el estado vacío', () => {
  setSession({ usuario: USUARIO_DEMO });
  montar();
  expect(screen.getByRole('heading', { name: 'Todavía no tenés coberturas' })).toBeInTheDocument();
});

test('sin nada contratado conserva el h1 de la página en el estado vacío', () => {
  setSession({ usuario: USUARIO_DEMO });
  montar();
  expect(screen.getByRole('heading', { level: 1, name: 'Mis coberturas' })).toBeInTheDocument();
});
