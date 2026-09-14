import { render, screen } from '@testing-library/react';
import { Money } from '@/ui/Money';

test('muestra el entero separado por miles', () => {
  render(<Money monto={20000} />);
  expect(screen.getByText('20.000')).toBeInTheDocument();
});

test('los decimales van en superíndice', () => {
  const { container } = render(<Money monto={20000} />);
  expect(container.querySelector('sup')).toHaveTextContent('00');
});

test('el lector de pantalla recibe el monto completo con el período', () => {
  render(<Money monto={12000} periodo="por mes" />);
  expect(screen.getByText('$12.000,00 por mes')).toBeInTheDocument();
});

test('sin período el texto accesible es solo el monto', () => {
  render(<Money monto={7000} />);
  expect(screen.getByText('$7.000,00')).toBeInTheDocument();
});
