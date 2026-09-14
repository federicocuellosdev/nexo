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
  expect(screen.getByText('$12.000')).toBeInTheDocument();
  expect(screen.getByText('por mes')).toBeInTheDocument();
});

test('lista TODAS las prestaciones del plan, no sólo las incluidas', () => {
  render(
    <MemoryRouter>
      <PlanCard plan={NEXO_2} hrefDetalle="/planes/nexo-2" />
    </MemoryRouter>,
  );
  // Nexo II tiene 8: incluidas, con coseguro y no incluidas. Antes la tarjeta
  // filtraba a `incluido` y cortaba en 4, así que escondía los coseguros
  // —prestaciones que SÍ tenés, con copago— y las exclusiones.
  expect(screen.getAllByRole('listitem')).toHaveLength(NEXO_2.prestaciones.length);
});

test('muestra las prestaciones NO incluidas: no se asume por omisión', () => {
  render(
    <MemoryRouter>
      <PlanCard plan={NEXO_2} hrefDetalle="/planes/nexo-2" />
    </MemoryRouter>,
  );
  // `no-incluido` es un estado EXPLÍCITO en mock/planes.ts justamente para que
  // nadie crea que un plan trae ambulancia porque nadie dijo lo contrario.
  expect(screen.getByText('Emergencias médicas')).toBeInTheDocument();
  expect(screen.getByText('Guardia odontológica')).toBeInTheDocument();
});

test('muestra los coseguros, que son prestaciones cubiertas con copago', () => {
  render(
    <MemoryRouter>
      <PlanCard plan={NEXO_2} hrefDetalle="/planes/nexo-2" />
    </MemoryRouter>,
  );
  expect(screen.getByText('Doc24 · Clínica')).toBeInTheDocument();
  expect(screen.getByText('1 consulta sin cargo · luego $18.000')).toBeInTheDocument();
});

test('ya no existe el chip "datos a confirmar" de la tarjeta entera', () => {
  // Existía sólo para avisar que el recorte de cuatro había tapado algo
  // pendiente. Sin recorte no hay nada tapado, y cada prestación lleva su
  // propio chip donde corresponde.
  render(
    <MemoryRouter>
      <PlanCard plan={NEXO_1} hrefDetalle="/planes/nexo-1" />
    </MemoryRouter>,
  );
  expect(screen.queryByText('datos a confirmar')).not.toBeInTheDocument();
  expect(screen.getAllByText('a confirmar').length).toBeGreaterThan(0);
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
