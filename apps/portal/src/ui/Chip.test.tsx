import { render, screen } from '@testing-library/react';
import { CircleAlert } from 'lucide-react';
import { Chip } from '@/ui/Chip';

test('muestra el texto del chip', () => {
  render(<Chip tono="warn">a confirmar</Chip>);
  expect(screen.getByText('a confirmar')).toBeInTheDocument();
});

test('el tono warn pinta texto y borde ámbar', () => {
  render(<Chip tono="warn">a confirmar</Chip>);
  const chip = screen.getByText('a confirmar');
  expect(chip).toHaveClass('text-warn-700');
  expect(chip).toHaveClass('border-warn-500/30');
});

test('el icono opcional se marca como decorativo', () => {
  const { container } = render(
    <Chip tono="warn" icono={CircleAlert}>
      a confirmar
    </Chip>,
  );
  expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
});
