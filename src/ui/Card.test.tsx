import { render, screen } from '@testing-library/react';
import { Card } from '@/ui/Card';

test('renderiza un div con superficie blanca y radio de card', () => {
  const { container } = render(<Card>contenido</Card>);
  const raiz = container.firstElementChild;
  expect(raiz?.tagName).toBe('DIV');
  expect(raiz).toHaveClass('bg-white');
  expect(raiz).toHaveClass('rounded-card');
});

test('la card destacada lleva anillo de marca', () => {
  const { container } = render(<Card destacada>contenido</Card>);
  expect(container.firstElementChild).toHaveClass('ring-marca-500');
});

test('puede renderizarse como article para las tarjetas de plan', () => {
  render(<Card as="article">Nexo I</Card>);
  expect(screen.getByRole('article')).toHaveTextContent('Nexo I');
});
