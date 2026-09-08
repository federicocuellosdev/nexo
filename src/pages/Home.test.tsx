import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen } from '@testing-library/react';
import { rutas } from '@/router';

function montarEn(ruta: string) {
  const router = createMemoryRouter(rutas, { initialEntries: [ruta] });
  return render(<RouterProvider router={router} />);
}

test('el hero muestra el precio de entrada derivado de los planes', () => {
  montarEn('/');
  expect(screen.getByText(/desde \$7\.000 por mes/i)).toBeInTheDocument();
});

test('el hero lleva al catálogo', () => {
  montarEn('/');
  expect(screen.getByRole('link', { name: 'Ver planes' })).toHaveAttribute('href', '/catalogo');
});

test('explica el alta en tres pasos', () => {
  montarEn('/');
  const seccion = screen.getByRole('region', { name: 'Cómo funciona' });
  expect(seccion.querySelectorAll('li')).toHaveLength(3);
});

test('muestra las tres tarjetas de plan', () => {
  montarEn('/');
  const seccion = screen.getByRole('region', { name: 'Nuestros planes' });
  expect(seccion.querySelectorAll('article')).toHaveLength(3);
});

test('muestra los cinco productos on demand', () => {
  montarEn('/');
  const seccion = screen.getByRole('region', { name: 'Productos on demand' });
  expect(seccion.querySelectorAll('article')).toHaveLength(5);
});

test('las preguntas frecuentes tienen cuatro ítems plegables', () => {
  montarEn('/');
  const seccion = screen.getByRole('region', { name: 'Preguntas frecuentes' });
  expect(seccion.querySelectorAll('details')).toHaveLength(4);
});
