import { render, screen } from '@testing-library/react';
import { TopBar } from '@/ui/TopBar';

test('renderiza la marca dentro de un banner', () => {
  render(<TopBar marca={<span>nexo</span>} />);
  expect(screen.getByRole('banner')).toHaveTextContent('nexo');
});

test('renderiza las acciones', () => {
  render(<TopBar marca={<span>nexo</span>} acciones={<button type="button">Ingresar</button>} />);
  expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
});
