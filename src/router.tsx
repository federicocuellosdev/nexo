import type { RouteObject } from 'react-router';
import { createBrowserRouter, Navigate } from 'react-router';
import { AuthCallback } from '@/pages/AuthCallback';
import { Ingresar } from '@/pages/Ingresar';

/**
 * Se exporta el arreglo además del router para que los tests puedan montar
 * `createMemoryRouter(rutas, { initialEntries: [...] })`.
 * Las tareas 9 a 20 agregan las rutas privadas debajo de `PortalLayout`.
 */
export const rutas: RouteObject[] = [
  { path: '/', element: <Navigate to="/inicio" replace /> },
  { path: '/auth/callback', element: <AuthCallback /> },
  { path: '/ingresar', element: <Ingresar /> },
];

export const router = createBrowserRouter(rutas);
