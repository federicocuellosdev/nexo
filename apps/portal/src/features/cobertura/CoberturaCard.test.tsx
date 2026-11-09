import { MemoryRouter } from 'react-router';
import { render, screen } from '@testing-library/react';
import { CoberturaCard } from '@/features/cobertura/CoberturaCard';
import { buscarPlan } from '@/mock/planes';

const NEXO_2 = buscarPlan('nexo-2')!;

test('muestra el plan, su precio y el próximo vencimiento', () => {
  render(
    <MemoryRouter>
      <CoberturaCard plan={NEXO_2} estado="activo" proximoVencimiento="01/10/2026" />
    </MemoryRouter>,
  );
  expect(screen.getByText('Nexo II')).toBeInTheDocument();
  expect(screen.getByText('$15.000,00 por mes')).toBeInTheDocument();
  expect(screen.getByText('Vence el 01/10/2026')).toBeInTheDocument();
});

test('el nombre del plan es un encabezado, como en PlanCard', () => {
  render(
    <MemoryRouter>
      <CoberturaCard plan={NEXO_2} estado="activo" proximoVencimiento="01/10/2026" />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: 'Nexo II' })).toBeInTheDocument();
});

test('activa muestra el chip verde y ningún CTA de completar perfil', () => {
  render(
    <MemoryRouter>
      <CoberturaCard plan={NEXO_2} estado="activo" proximoVencimiento="01/10/2026" />
    </MemoryRouter>,
  );
  expect(screen.getByText('Activa')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Completar perfil' })).not.toBeInTheDocument();
});

test('activa enlaza a la cobertura', () => {
  render(
    <MemoryRouter>
      <CoberturaCard plan={NEXO_2} estado="activo" proximoVencimiento="01/10/2026" />
    </MemoryRouter>,
  );
  expect(screen.getByRole('link', { name: 'Ver mi cobertura' })).toHaveAttribute(
    'href',
    '/coberturas',
  );
});

test('con cuenta y sin pago ofrece pagar, no ver la cobertura', () => {
  render(
    <MemoryRouter>
      <CoberturaCard plan={NEXO_2} estado="conCuentaSinPago" proximoVencimiento="01/10/2026" />
    </MemoryRouter>,
  );
  expect(screen.getByRole('link', { name: 'Pagar mi plan' })).toHaveAttribute('href', '/pago');
  expect(screen.queryByRole('link', { name: 'Ver mi cobertura' })).not.toBeInTheDocument();
});

test('pendiente de activación muestra el chip de estado pero NO el CTA interno', () => {
  // El CTA "Completar perfil" se extrajo de esta tarjeta: vive como columna
  // hermana que arma /inicio. Acá se verifica que la tarjeta sólo informa el
  // estado y no duplica la acción.
  render(
    <MemoryRouter>
      <CoberturaCard plan={NEXO_2} estado="pagadoSinPerfil" proximoVencimiento="01/10/2026" />
    </MemoryRouter>,
  );
  expect(screen.getByText('Pendiente de activación')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Completar perfil' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Ver mi cobertura' })).not.toBeInTheDocument();
});
