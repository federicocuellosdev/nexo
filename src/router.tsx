import type { RouteObject } from 'react-router';
import { createBrowserRouter } from 'react-router';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Home } from '@/pages/Home';
import { Catalogo } from '@/pages/Catalogo';

/**
 * Se exporta el arreglo además del router para que los tests puedan montar
 * `createMemoryRouter(rutas, { initialEntries: [...] })` sin tocar la URL real.
 */
export const rutas: RouteObject[] = [
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'catalogo', element: <Catalogo /> },
    ],
  },
];

export const router = createBrowserRouter(rutas);
