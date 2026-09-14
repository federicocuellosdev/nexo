import { render, screen } from '@testing-library/react';
import { PlanPrestaciones } from '@/features/planes/PlanPrestaciones';
import { buscarPlan } from '@/mock/planes';

const NEXO_2 = buscarPlan('nexo-2')!;

test('lista todas las prestaciones del plan, incluidas las no incluidas', () => {
  render(<PlanPrestaciones prestaciones={NEXO_2.prestaciones} />);
  expect(screen.getAllByRole('listitem')).toHaveLength(NEXO_2.prestaciones.length);
  expect(screen.getByText('Emergencias médicas')).toBeInTheDocument();
});

test('cada estado se anuncia con un icono etiquetado', () => {
  render(<PlanPrestaciones prestaciones={NEXO_2.prestaciones} />);
  expect(screen.getAllByRole('img', { name: 'Incluido' }).length).toBeGreaterThan(0);
  expect(screen.getAllByRole('img', { name: 'Con coseguro' }).length).toBeGreaterThan(0);
  expect(screen.getAllByRole('img', { name: 'No incluido' }).length).toBeGreaterThan(0);
});

test('muestra el detalle del coseguro', () => {
  render(<PlanPrestaciones prestaciones={NEXO_2.prestaciones} />);
  expect(screen.getByText('1 consulta sin cargo · luego $18.000')).toBeInTheDocument();
});

test('marca con chip los datos que el cliente no confirmó', () => {
  render(<PlanPrestaciones prestaciones={NEXO_2.prestaciones} />);
  const pendientes = screen.getAllByText('a confirmar');
  expect(pendientes).toHaveLength(1);
});
