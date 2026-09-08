import { MemoryRouter } from 'react-router';
import { render, screen } from '@testing-library/react';
import { House, ShieldCheck } from 'lucide-react';
import { Sidebar } from '@/ui/Sidebar';

const ITEMS = [
  { to: '/inicio', label: 'Inicio', icono: House },
  { to: '/coberturas', label: 'Coberturas', icono: ShieldCheck },
];

test('renderiza marca, ítems y pie', () => {
  render(
    <MemoryRouter initialEntries={['/inicio']}>
      <Sidebar marca={<span>nexo</span>} items={ITEMS} pie={<button type="button">Cerrar sesión</button>} />
    </MemoryRouter>,
  );
  expect(screen.getByText('nexo')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Coberturas' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
});

test('marca la ruta activa con aria-current', () => {
  render(
    <MemoryRouter initialEntries={['/coberturas']}>
      <Sidebar marca={<span>nexo</span>} items={ITEMS} />
    </MemoryRouter>,
  );
  expect(screen.getByRole('link', { name: 'Coberturas' })).toHaveAttribute('aria-current', 'page');
});
