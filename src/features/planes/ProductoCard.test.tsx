import { MemoryRouter } from 'react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductoCard } from '@/features/planes/ProductoCard';
import { buscarProducto } from '@/mock/planes';

const HOGAR = buscarProducto('hogar-1')!;
const VIDA = buscarProducto('vida')!;

test('muestra nombre, detalle y precio', () => {
  render(
    <MemoryRouter>
      <ProductoCard producto={HOGAR} hrefDetalle="/productos/hogar-1" />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: 'Seguro de Hogar · hasta 1er piso' })).toBeInTheDocument();
  expect(screen.getByText('Casas, PB y 1er piso · Solo en Rosario')).toBeInTheDocument();
  expect(screen.getByText('$19.000,00 por mes')).toBeInTheDocument();
});

test('el precio sin confirmar lleva el chip "a confirmar"', () => {
  render(
    <MemoryRouter>
      <ProductoCard producto={VIDA} hrefDetalle="/productos/vida" />
    </MemoryRouter>,
  );
  expect(screen.getByText('a confirmar')).toBeInTheDocument();
});

test('el producto con precio confirmado no lleva chip', () => {
  render(
    <MemoryRouter>
      <ProductoCard producto={HOGAR} hrefDetalle="/productos/hogar-1" />
    </MemoryRouter>,
  );
  expect(screen.queryByText('a confirmar')).not.toBeInTheDocument();
});

test('con hrefDetalle el CTA es un enlace', () => {
  render(
    <MemoryRouter>
      <ProductoCard producto={HOGAR} hrefDetalle="/productos/hogar-1" etiquetaCta="Ver producto" />
    </MemoryRouter>,
  );
  expect(screen.getByRole('link', { name: 'Ver producto' })).toHaveAttribute('href', '/productos/hogar-1');
});

test('con onCta el CTA es un botón que entrega el producto', async () => {
  const usuario = userEvent.setup();
  const alContratar = vi.fn();
  render(
    <MemoryRouter>
      <ProductoCard producto={HOGAR} onCta={alContratar} etiquetaCta="Contratar" />
    </MemoryRouter>,
  );
  await usuario.click(screen.getByRole('button', { name: 'Contratar' }));
  expect(alContratar).toHaveBeenCalledWith(HOGAR);
});
