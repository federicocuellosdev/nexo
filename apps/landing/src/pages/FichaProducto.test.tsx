import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen } from '@testing-library/react';
import { rutas } from '@/router';

function montarEn(ruta: string) {
  const router = createMemoryRouter(rutas, { initialEntries: [ruta] });
  return render(<RouterProvider router={router} />);
}

test('muestra nombre, detalle y precio del producto', () => {
  montarEn('/productos/hogar-2');
  expect(screen.getByRole('heading', { level: 1, name: 'Seguro de Hogar · 2do piso +' })).toBeInTheDocument();
  expect(screen.getByText('Dentro y fuera de Rosario')).toBeInTheDocument();
  expect(screen.getByText('$22.000,00 por mes')).toBeInTheDocument();
});

test('aclara que el producto requiere un plan activo', () => {
  montarEn('/productos/hogar-2');
  expect(screen.getByText(/requiere un plan activo/i)).toBeInTheDocument();
});

test('el precio sin confirmar se marca con el chip', () => {
  montarEn('/productos/vida');
  expect(screen.getByText('a confirmar')).toBeInTheDocument();
});

test('tiene un CTA para contratar', () => {
  montarEn('/productos/hogar-2');
  expect(screen.getByRole('button', { name: 'Contratar Seguro de Hogar · 2do piso +' })).toBeInTheDocument();
});

test('un id inexistente muestra un estado vacío', () => {
  montarEn('/productos/no-existe');
  expect(screen.getByRole('heading', { name: 'No encontramos ese producto' })).toBeInTheDocument();
});
