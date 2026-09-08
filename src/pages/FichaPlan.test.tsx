import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen } from '@testing-library/react';
import { rutas } from '@/router';

function montarEn(ruta: string) {
  const router = createMemoryRouter(rutas, { initialEntries: [ruta] });
  return render(<RouterProvider router={router} />);
}

test('muestra el nombre, la bajada y el precio del plan', () => {
  montarEn('/planes/nexo-2');
  expect(screen.getByRole('heading', { level: 1, name: 'Nexo II' })).toBeInTheDocument();
  expect(screen.getByText('Seguro de salud, farmacia y óptica, con telemedicina.')).toBeInTheDocument();
  expect(screen.getByText('$12.000,00 por mes')).toBeInTheDocument();
});

test('lista todas las prestaciones con su estado', () => {
  montarEn('/planes/nexo-2');
  expect(screen.getAllByRole('listitem')).toHaveLength(8);
});

test('muestra el comparador contra los otros dos planes', () => {
  montarEn('/planes/nexo-2');
  const encabezados = screen.getAllByRole('columnheader').map((c) => c.textContent);
  expect(encabezados).toEqual(['Prestación', 'Nexo II', 'Nexo I', 'Nexo III']);
});

test('tiene un CTA fijo para contratar', () => {
  montarEn('/planes/nexo-2');
  expect(screen.getByRole('button', { name: 'Contratar Nexo II' })).toBeInTheDocument();
});

test('un slug inexistente muestra un estado vacío en vez de romper', () => {
  montarEn('/planes/nexo-9');
  expect(screen.getByRole('heading', { name: 'No encontramos ese plan' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Ver el catálogo' })).toHaveAttribute('href', '/catalogo');
});
