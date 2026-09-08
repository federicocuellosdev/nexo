import { render, screen } from '@testing-library/react';
import { Receipt } from 'lucide-react';
import { EmptyState } from '@/ui/EmptyState';

test('muestra el título como encabezado', () => {
  render(<EmptyState icono={Receipt} titulo="Todavía no hay movimientos" />);
  expect(screen.getByRole('heading', { name: 'Todavía no hay movimientos' })).toBeInTheDocument();
});

test('muestra la descripción cuando se pasa', () => {
  render(<EmptyState icono={Receipt} titulo="Sin movimientos" descripcion="Acá vas a ver tus pagos." />);
  expect(screen.getByText('Acá vas a ver tus pagos.')).toBeInTheDocument();
});

test('renderiza la acción que le pasen', () => {
  render(
    <EmptyState icono={Receipt} titulo="Sin movimientos">
      <button type="button">Ver planes</button>
    </EmptyState>,
  );
  expect(screen.getByRole('button', { name: 'Ver planes' })).toBeInTheDocument();
});
