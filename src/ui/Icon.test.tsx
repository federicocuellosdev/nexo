import { render, screen } from '@testing-library/react';
import { Check } from 'lucide-react';
import { Icon } from '@/ui/Icon';

test('sin etiqueta el icono es decorativo', () => {
  const { container } = render(<Icon icono={Check} />);
  expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
});

test('con etiqueta se anuncia como imagen con nombre', () => {
  render(<Icon icono={Check} tono="ok" etiqueta="Incluido" />);
  expect(screen.getByRole('img', { name: 'Incluido' })).toBeInTheDocument();
});

test('el círculo del tono marca usa el degradado', () => {
  const { container } = render(<Icon icono={Check} tono="marca" />);
  expect(container.firstElementChild).toHaveClass('bg-brand');
});

test('el tamaño sm reduce el círculo', () => {
  const { container } = render(<Icon icono={Check} tamano="sm" />);
  expect(container.firstElementChild).toHaveClass('size-8');
});
