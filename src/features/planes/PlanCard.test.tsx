import { MemoryRouter } from 'react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlanCard } from '@/features/planes/PlanCard';
import { buscarPlan } from '@/mock/planes';

const NEXO_1 = buscarPlan('nexo-1')!;
const NEXO_2 = buscarPlan('nexo-2')!;

test('muestra nombre, bajada y precio del plan', () => {
  render(
    <MemoryRouter>
      <PlanCard plan={NEXO_2} hrefDetalle="/planes/nexo-2" />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: 'Nexo II' })).toBeInTheDocument();
  expect(screen.getByText('Seguro de salud, farmacia y óptica, con telemedicina.')).toBeInTheDocument();
  expect(screen.getByText('$12.000,00 por mes')).toBeInTheDocument();
});

test('lista solo las prestaciones incluidas, hasta cuatro', () => {
  render(
    <MemoryRouter>
      <PlanCard plan={NEXO_2} hrefDetalle="/planes/nexo-2" />
    </MemoryRouter>,
  );
  expect(screen.getAllByRole('listitem')).toHaveLength(4);
  expect(screen.queryByText('Emergencias médicas')).not.toBeInTheDocument();
});

test('las prestaciones sin confirmar llevan el chip "a confirmar"', () => {
  render(
    <MemoryRouter>
      <PlanCard plan={NEXO_2} hrefDetalle="/planes/nexo-2" />
    </MemoryRouter>,
  );
  expect(screen.getByText('a confirmar')).toBeInTheDocument();
});

test('destacado muestra el badge Recomendado', () => {
  render(
    <MemoryRouter>
      <PlanCard plan={NEXO_1} destacado hrefDetalle="/planes/nexo-1" />
    </MemoryRouter>,
  );
  expect(screen.getByText('Recomendado')).toBeInTheDocument();
});

test('activo muestra el badge Tu plan y gana sobre destacado', () => {
  render(
    <MemoryRouter>
      <PlanCard plan={NEXO_1} destacado activo />
    </MemoryRouter>,
  );
  expect(screen.getByText('Tu plan')).toBeInTheDocument();
  expect(screen.queryByText('Recomendado')).not.toBeInTheDocument();
});

test('con hrefDetalle el CTA es un enlace a la ficha', () => {
  render(
    <MemoryRouter>
      <PlanCard plan={NEXO_2} hrefDetalle="/planes/nexo-2" etiquetaCta="Ver plan" />
    </MemoryRouter>,
  );
  expect(screen.getByRole('link', { name: 'Ver plan' })).toHaveAttribute('href', '/planes/nexo-2');
});

test('con onCta el CTA es un botón que entrega el plan', async () => {
  const usuario = userEvent.setup();
  const alContratar = vi.fn();
  render(
    <MemoryRouter>
      <PlanCard plan={NEXO_2} onCta={alContratar} etiquetaCta="Contratar" />
    </MemoryRouter>,
  );
  await usuario.click(screen.getByRole('button', { name: 'Contratar' }));
  expect(alContratar).toHaveBeenCalledWith(NEXO_2);
});
