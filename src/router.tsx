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
import { Inicio } from '@/pages/Inicio';
import { Planes } from '@/pages/Planes';
import { Coberturas } from '@/pages/Coberturas';
import { Movimientos } from '@/pages/Movimientos';
import { Cuenta } from '@/pages/Cuenta';
import { Demo } from '@/pages/Demo';

/**
 * Se exporta el arreglo además del router para que los tests puedan montar
 * `createMemoryRouter(rutas, { initialEntries: [...] })`.
 * Las tareas 11 a 20 agregan más rutas privadas debajo de `PortalLayout`.
 */
export const rutas: RouteObject[] = [
  { path: '/', element: <Navigate to="/inicio" replace /> },
  { path: '/auth/callback', element: <AuthCallback /> },
  { path: '/ingresar', element: <Ingresar /> },
  { path: '/demo', element: <Demo /> },
  {
    path: '/',
    element: (
      <RequiereUsuario>
        <PortalLayout />
      </RequiereUsuario>
    ),
    children: [
      { path: 'inicio', element: <Inicio /> },
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
      { path: 'planes', element: <Planes /> },
      { path: 'coberturas', element: <Coberturas /> },
      { path: 'movimientos', element: <Movimientos /> },
      { path: 'cuenta', element: <Cuenta /> },
    ],
  },
];

export const router = createBrowserRouter(rutas);
