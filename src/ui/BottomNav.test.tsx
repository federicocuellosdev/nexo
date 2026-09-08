import { MemoryRouter } from 'react-router';
import { render, screen } from '@testing-library/react';
import { House, ShieldCheck } from 'lucide-react';
import { BottomNav } from '@/ui/BottomNav';

const ITEMS = [
  { to: '/inicio', label: 'Inicio', icono: House },
  { to: '/coberturas', label: 'Coberturas', icono: ShieldCheck },
];

test('renderiza un enlace por ítem', () => {
  render(
    <MemoryRouter initialEntries={['/inicio']}>
      <BottomNav items={ITEMS} />
    </MemoryRouter>,
  );
  expect(screen.getAllByRole('link')).toHaveLength(2);
});

test('marca la ruta activa con aria-current', () => {
  render(
    <MemoryRouter initialEntries={['/inicio']}>
      <BottomNav items={ITEMS} />
    </MemoryRouter>,
  );
  expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: 'Coberturas' })).not.toHaveAttribute('aria-current');
});

test('se oculta en pantallas grandes', () => {
  render(
    <MemoryRouter initialEntries={['/inicio']}>
      <BottomNav items={ITEMS} />
    </MemoryRouter>,
  );
  expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toHaveClass('lg:hidden');
});
