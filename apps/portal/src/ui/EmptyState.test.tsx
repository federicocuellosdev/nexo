import { render, screen } from '@testing-library/react';
import { Receipt } from 'lucide-react';
import { EmptyState } from '@/ui/EmptyState';

test('muestra el título como encabezado', () => {
  render(<EmptyState icono={Receipt} titulo="Todavía no hay movimientos" />);
  expect(screen.getByRole('heading', { name: 'Todavía no hay movimientos' })).toBeInTheDocument();
});

test('por defecto es h3, que es el caso de un vacío dentro de una pantalla', () => {
  render(<EmptyState icono={Receipt} titulo="Sin movimientos" />);
  expect(screen.getByRole('heading', { level: 3, name: 'Sin movimientos' })).toBeInTheDocument();
});

test('acepta h1 para cuando el vacío ES la pantalla entera', () => {
  // Sin esto, /no-existe y las fichas con slug inválido quedaban SIN ningún h1
  // y la jerarquía arrancaba en h3: quien navega por encabezados con un lector
  // de pantalla no encontraba el título de la página (WCAG 1.3.1).
  render(<EmptyState icono={Receipt} como="h1" titulo="Esta página no existe" />);
  expect(screen.getByRole('heading', { level: 1, name: 'Esta página no existe' })).toBeInTheDocument();
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
