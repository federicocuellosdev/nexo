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

test('el círculo del tono marca es plano, como el resto de los tonos', () => {
  // `Badge` ya pintaba el tono marca con este mismo par (`marca-50`/`marca-700`);
  // era `Icon` el único que usaba el degradado y rompía la consistencia.
  const { container } = render(<Icon icono={Check} tono="marca" />);
  expect(container.firstElementChild).toHaveClass('bg-marca-50');
  expect(container.firstElementChild).toHaveClass('text-marca-700');
  expect(container.firstElementChild).not.toHaveClass('bg-brand');
});

test('el tamaño sm reduce el círculo', () => {
  const { container } = render(<Icon icono={Check} tamano="sm" />);
  expect(container.firstElementChild).toHaveClass('size-8');
});

test('el tamaño lg agranda el círculo y el glifo', () => {
  const { container } = render(<Icon icono={Check} tamano="lg" />);
  expect(container.firstElementChild).toHaveClass('size-20');
  expect(container.querySelector('svg')).toHaveAttribute('width', '32');
});
