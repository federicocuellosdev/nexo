import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rutas } from '@/router';

function montarEn(ruta: string) {
  const router = createMemoryRouter(rutas, { initialEntries: [ruta] });
  return render(<RouterProvider router={router} />);
}

test('arranca en la pestaña Planes con las tres tarjetas', () => {
  montarEn('/catalogo');
  expect(screen.getByRole('tab', { name: 'Planes' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getAllByRole('article')).toHaveLength(3);
});

test('la pestaña Productos muestra los cinco servicios on demand', async () => {
  const usuario = userEvent.setup();
  montarEn('/catalogo');
  await usuario.click(screen.getByRole('tab', { name: 'Productos' }));
  expect(screen.getByRole('tab', { name: 'Productos' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getAllByRole('article')).toHaveLength(5);
});

test('montar en /catalogo?tab=productos arranca directo en la pestaña Productos', () => {
  montarEn('/catalogo?tab=productos');
  expect(screen.getByRole('tab', { name: 'Productos' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getAllByRole('article')).toHaveLength(5);
});

test('la pestaña Planes incluye el comparador de prestaciones', () => {
  montarEn('/catalogo');
  expect(screen.getByRole('table')).toBeInTheDocument();
});

test('cada tarjeta de plan enlaza a su ficha', () => {
  montarEn('/catalogo');
  expect(screen.getByRole('link', { name: 'Ver plan Nexo II' })).toHaveAttribute('href', '/planes/nexo-2');
});
