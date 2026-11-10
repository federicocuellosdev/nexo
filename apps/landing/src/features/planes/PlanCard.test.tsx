import { MemoryRouter } from 'react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlanCard } from '@/features/planes/PlanCard';
import { buscarPlan, type Plan } from '@/mock/planes';

const NEXO_1 = buscarPlan('nexo-1')!;

/** Plan sintético con 5 prestaciones, la 5ª pendiente. Usamos slug válido
 *  (hoy solo existe 'nexo-1') y pisamos nombre/prestaciones para aislar el
 *  test del catálogo real. */
const PLAN_CON_RECORTE_PENDIENTE: Plan = {
  slug: 'nexo-1',
  nombre: 'Nexo Test',
  precio: 10000,
  bajada: 'Plan de prueba para el recorte del teaser.',
  prestaciones: [
    { label: 'Prestación 1', estado: 'incluido' },
    { label: 'Prestación 2', estado: 'incluido' },
    { label: 'Prestación 3', estado: 'incluido' },
    { label: 'Prestación 4', estado: 'incluido' },
    { label: 'Prestación 5', estado: 'incluido', pendiente: true },
  ],
};

test('muestra nombre, bajada y precio del plan', () => {
  render(
    <MemoryRouter>
      <PlanCard plan={NEXO_1} hrefDetalle="/planes/nexo-1" />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: NEXO_1.nombre })).toBeInTheDocument();
  expect(screen.getByText(NEXO_1.bajada)).toBeInTheDocument();
  expect(screen.getByText('$15.000,00 por mes')).toBeInTheDocument();
});

test('lista solo las prestaciones incluidas, hasta cuatro', () => {
  render(
    <MemoryRouter>
      <PlanCard plan={PLAN_CON_RECORTE_PENDIENTE} hrefDetalle="/planes/nexo-1" />
    </MemoryRouter>,
  );
  expect(screen.getAllByRole('listitem')).toHaveLength(4);
});

test('si el recorte de cuatro descarta una prestación pendiente, muestra el chip "datos a confirmar"', () => {
  render(
    <MemoryRouter>
      <PlanCard plan={PLAN_CON_RECORTE_PENDIENTE} hrefDetalle="/planes/test" />
    </MemoryRouter>,
  );
  expect(screen.getAllByRole('listitem')).toHaveLength(4);
  expect(screen.queryByText('Prestación 5')).not.toBeInTheDocument();
  expect(screen.getByText('datos a confirmar')).toBeInTheDocument();
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
      <PlanCard plan={NEXO_1} hrefDetalle="/planes/nexo-1" etiquetaCta="Ver plan" />
    </MemoryRouter>,
  );
  expect(screen.getByRole('link', { name: 'Ver plan' })).toHaveAttribute('href', '/planes/nexo-1');
});

test('con onCta el CTA es un botón que entrega el plan', async () => {
  const usuario = userEvent.setup();
  const alContratar = vi.fn();
  render(
    <MemoryRouter>
      <PlanCard plan={NEXO_1} onCta={alContratar} etiquetaCta="Contratar" />
    </MemoryRouter>,
  );
  await usuario.click(screen.getByRole('button', { name: 'Contratar' }));
  expect(alContratar).toHaveBeenCalledWith(NEXO_1);
});
