import { render, screen } from '@testing-library/react';
import { filtrarMovimientos, MovimientosList } from '@/features/movimientos/MovimientosList';
import type { Orden } from '@/mock/session';

const CUOTA: Orden = {
  id: 'ord-1',
  fecha: '2026-09-01',
  tipo: 'plan',
  itemId: 'nexo-2',
  concepto: 'Nexo II · cuota mensual',
  monto: 12000,
  estado: 'pagada',
};

const PRODUCTO: Orden = {
  id: 'ord-2',
  fecha: '2026-09-02',
  tipo: 'producto',
  itemId: 'hogar-1',
  concepto: 'Seguro de Hogar · hasta 1er piso · cuota mensual',
  monto: 19000,
  estado: 'pendiente',
};

test('todos devuelve la lista completa', () => {
  expect(filtrarMovimientos([CUOTA, PRODUCTO], 'todos')).toHaveLength(2);
});

test('pagos deja solo las cuotas de plan', () => {
  expect(filtrarMovimientos([CUOTA, PRODUCTO], 'pagos').map((o) => o.id)).toEqual(['ord-1']);
});

test('contrataciones deja solo los productos on demand', () => {
  expect(filtrarMovimientos([CUOTA, PRODUCTO], 'contrataciones').map((o) => o.id)).toEqual(['ord-2']);
});

test('renderiza una fila por movimiento con concepto, fecha y monto', () => {
  render(<MovimientosList ordenes={[CUOTA, PRODUCTO]} />);
  expect(screen.getAllByRole('listitem')).toHaveLength(2);
  expect(screen.getByText('Nexo II · cuota mensual')).toBeInTheDocument();
  expect(screen.getByText('01/09/2026')).toBeInTheDocument();
  expect(screen.getByText('$12.000,00')).toBeInTheDocument();
});

test('el estado se muestra con un chip por movimiento', () => {
  render(<MovimientosList ordenes={[CUOTA, PRODUCTO]} />);
  expect(screen.getByText('Pagada')).toBeInTheDocument();
  expect(screen.getByText('Pendiente')).toBeInTheDocument();
});

test('sin movimientos muestra el estado vacío', () => {
  render(<MovimientosList ordenes={[]} />);
  expect(screen.getByRole('heading', { name: 'Todavía no hay movimientos' })).toBeInTheDocument();
});
