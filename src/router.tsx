import type { RouteObject } from 'react-router';
import { createBrowserRouter, Navigate } from 'react-router';
import { PortalLayout } from '@/layouts/PortalLayout';
import { RequiereIntent, RequiereUsuario } from '@/features/sesion/Guards';
import { AuthCallback } from '@/pages/AuthCallback';
import { Ingresar } from '@/pages/Ingresar';
import { Bienvenida } from '@/pages/Bienvenida';
import { Pago } from '@/pages/Pago';
import { PagoExito } from '@/pages/PagoExito';
import { PerfilCompletar } from '@/pages/PerfilCompletar';

/**
 * Se exporta el arreglo además del router para que los tests puedan montar
 * `createMemoryRouter(rutas, { initialEntries: [...] })`.
 * Las tareas 11 a 20 agregan más rutas privadas debajo de `PortalLayout`.
 */
export const rutas: RouteObject[] = [
  { path: '/', element: <Navigate to="/inicio" replace /> },
  { path: '/auth/callback', element: <AuthCallback /> },
  { path: '/ingresar', element: <Ingresar /> },
  {
    path: '/',
    element: (
      <RequiereUsuario>
        <PortalLayout />
      </RequiereUsuario>
    ),
    children: [
      {
        path: 'bienvenida',
        element: (
          <RequiereIntent>
            <Bienvenida />
          </RequiereIntent>
        ),
      },
      { path: 'pago', element: <Pago /> },
      { path: 'pago/exito', element: <PagoExito /> },
      { path: 'perfil/completar', element: <PerfilCompletar /> },
    ],
  },
];

export const router = createBrowserRouter(rutas);
