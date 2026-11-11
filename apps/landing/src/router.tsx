import type { RouteObject } from 'react-router';
import { createBrowserRouter } from 'react-router';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Home } from '@/pages/Home';
import { Catalogo } from '@/pages/Catalogo';
import { Contratar } from '@/pages/Contratar';
import { FichaPlan } from '@/pages/FichaPlan';
import { RevisaTuMail } from '@/pages/RevisaTuMail';
import { Terminos } from '@/pages/Terminos';
import { Onboarding } from '@/pages/Onboarding';
import { NoEncontrada } from '@/pages/NoEncontrada';

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
      { path: 'planes/:slug', element: <FichaPlan /> },
      { path: 'contratar/:tipo/:id', element: <Contratar /> },
      { path: 'onboarding', element: <Onboarding /> },
      { path: 'revisa-tu-mail', element: <RevisaTuMail /> },
      { path: 'terminos', element: <Terminos /> },
      { path: '*', element: <NoEncontrada /> },
    ],
  },
];

export const router = createBrowserRouter(rutas);
