import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen } from '@testing-library/react';
import { rutas } from '@/router';

/**
 * Ninguna pantalla pública debe saltear niveles de encabezado
 * (WCAG 1.3.1 / técnica G141), ni quedarse sin h1.
 *
 * Se agregó junto con la prop `como` de `EmptyState`: ese componente traía un
 * `h3` fijo, así que las pantallas donde el estado vacío ES la página entera
 * (404, ficha con slug inválido) arrancaban en h3 y no tenían ningún h1.
 */
function montar(ruta: string) {
  const router = createMemoryRouter(rutas, { initialEntries: [ruta] });
  return render(<RouterProvider router={router} />);
}

function niveles(): number[] {
  return screen.getAllByRole('heading').map((h) => Number(h.tagName.slice(1)));
}

function saltos(ns: number[]): string[] {
  const encontrados: string[] = [];
  for (let i = 1; i < ns.length; i += 1) {
    if (ns[i] > ns[i - 1] + 1) encontrados.push(`h${ns[i - 1]} → h${ns[i]}`);
  }
  return encontrados;
}

const RUTAS = [
  '/',
  '/catalogo',
  '/catalogo?tab=productos',
  '/planes/nexo-1',
  '/planes/nexo-2',
  '/planes/nexo-3',
  '/productos/salud-1',
  '/productos/arbol-de-vida',
  // Caminos vacíos: acá el EmptyState ES la pantalla y tiene que traer el h1.
  '/planes/no-existe',
  '/productos/no-existe',
  '/revisa-tu-mail',
  '/ruta-que-no-existe',
];

test.each(RUTAS)('%s arranca en h1', (ruta) => {
  montar(ruta);
  expect(niveles()[0]).toBe(1);
});

test.each(RUTAS)('%s tiene exactamente un h1', (ruta) => {
  montar(ruta);
  expect(niveles().filter((n) => n === 1)).toHaveLength(1);
});

test.each(RUTAS)('%s no saltea niveles de encabezado', (ruta) => {
  montar(ruta);
  expect(saltos(niveles())).toEqual([]);
});
