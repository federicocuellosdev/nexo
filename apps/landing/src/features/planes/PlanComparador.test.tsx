import { render, screen, within } from '@testing-library/react';
import { PlanComparador } from '@/features/planes/PlanComparador';
import { buscarPlan, PLANES } from '@/mock/planes';

const NEXO_2 = buscarPlan('nexo-2')!;
const OTROS = PLANES.filter((p) => p.slug !== 'nexo-2');

test('la primera columna es el plan actual', () => {
  render(<PlanComparador actual={NEXO_2} otros={OTROS} />);
  const encabezados = screen.getAllByRole('columnheader').map((c) => c.textContent);
  expect(encabezados).toEqual(['Prestación', 'Nexo II', 'Nexo I', 'Nexo III']);
});

test('cada prestación de cualquiera de los planes aparece una sola vez', () => {
  render(<PlanComparador actual={NEXO_2} otros={OTROS} />);
  expect(screen.getAllByRole('rowheader')).toHaveLength(9);
  expect(screen.getAllByRole('rowheader', { name: 'Farmacia' })).toHaveLength(1);
});

test('una prestación que un plan no menciona se muestra como no incluida', () => {
  render(<PlanComparador actual={NEXO_2} otros={OTROS} />);
  const fila = screen.getByRole('rowheader', { name: 'Médico a domicilio' }).closest('tr');
  expect(fila).not.toBeNull();
  // Nexo II la incluye; Nexo I y Nexo III ni la nombran.
  expect(within(fila as HTMLElement).getAllByRole('img', { name: 'No incluido' })).toHaveLength(2);
});

test('la tabla tiene su propio scroll horizontal para no romper el ancho del body', () => {
  const { container } = render(<PlanComparador actual={NEXO_2} otros={OTROS} />);
  expect(container.querySelector('.overflow-x-auto')).not.toBeNull();
});

test('una prestación pendiente muestra el chip "a confirmar" junto al ícono de estado (spec §8)', () => {
  render(<PlanComparador actual={NEXO_2} otros={OTROS} />);
  // Nexo II · Médico a domicilio está marcado `pendiente: true` en el mock.
  const fila = screen.getByRole('rowheader', { name: 'Médico a domicilio' }).closest('tr');
  expect(fila).not.toBeNull();
  const dentroDeLaFila = within(fila as HTMLElement);
  expect(dentroDeLaFila.getByText('a confirmar')).toBeInTheDocument();
  expect(dentroDeLaFila.getByRole('img', { name: 'Incluido' })).toBeInTheDocument();
});
