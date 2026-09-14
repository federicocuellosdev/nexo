import { render, screen } from '@testing-library/react';
import { Badge } from '@/ui/Badge';

test('muestra el texto', () => {
  render(<Badge>Recomendado</Badge>);
  expect(screen.getByText('Recomendado')).toBeInTheDocument();
});

test('el tono marca usa el fondo suave de marca', () => {
  render(<Badge tono="marca">Recomendado</Badge>);
  expect(screen.getByText('Recomendado')).toHaveClass('bg-marca-50');
});

test('el tono por defecto es neutro', () => {
  render(<Badge>Opcional</Badge>);
  expect(screen.getByText('Opcional')).toHaveClass('bg-ink-100');
});
