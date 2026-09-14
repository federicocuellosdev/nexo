import { render, screen } from '@testing-library/react';
import { App } from '@/App';

test('la app monta el router y aterriza en la home', () => {
  render(<App />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tu salud, resuelta desde el celular');
});
