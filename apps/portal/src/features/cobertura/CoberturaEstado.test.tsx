import { render, screen } from '@testing-library/react';
import { CoberturaEstado } from '@/features/cobertura/CoberturaEstado';

test('el estado activo muestra el chip verde', () => {
  render(<CoberturaEstado estado="activo" />);
  const chip = screen.getByText('Activa');
  expect(chip).toHaveClass('text-ok-700');
});

test('pagado sin perfil muestra "pendiente de activación" en ámbar', () => {
  render(<CoberturaEstado estado="pagadoSinPerfil" />);
  const chip = screen.getByText('Pendiente de activación');
  expect(chip).toHaveClass('text-warn-700');
});

test('con cuenta y sin pago avisa que falta el pago', () => {
  render(<CoberturaEstado estado="conCuentaSinPago" />);
  expect(screen.getByText('Sin pagar')).toBeInTheDocument();
});

test('sin cuenta no muestra nada', () => {
  const { container } = render(<CoberturaEstado estado="sinCuenta" />);
  expect(container).toBeEmptyDOMElement();
});
