import { render, screen } from '@testing-library/react';
import { App } from '@/App';

test('la app monta y muestra el titular de la maqueta', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Nexo 3.0 — maqueta' })).toBeInTheDocument();
});
