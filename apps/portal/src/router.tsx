import type { RouteObject } from 'react-router';
import { createBrowserRouter, Navigate } from 'react-router';
import { PortalLayout } from '@/layouts/PortalLayout';
import { RequiereIntent, RequierePago, RequiereUsuario } from '@/features/sesion/Guards';
import { AuthCallback } from '@/pages/AuthCallback';
import { Ingresar } from '@/pages/Ingresar';
import { Bienvenida } from '@/pages/Bienvenida';
import { Pago } from '@/pages/Pago';
import { PagoExito } from '@/pages/PagoExito';
import { PerfilCompletar } from '@/pages/PerfilCompletar';
import { Inicio } from '@/pages/Inicio';
import { Planes } from '@/pages/Planes';
import { Coberturas } from '@/pages/Coberturas';
import { Familiares } from '@/pages/Familiares';
import { Movimientos } from '@/pages/Movimientos';
import { Cuenta } from '@/pages/Cuenta';
import { Demo } from '@/pages/Demo';
import { Verificar } from '@/pages/Verificar';
import { ElegirVista } from '@/pages/ElegirVista';
import { AdminLayout } from '@/layouts/AdminLayout';
import { AdminDashboard } from '@/pages/admin/Dashboard';
import { AdminVendedores } from '@/pages/admin/Vendedores';
import { AdminNegocio } from '@/pages/admin/Negocio';

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
  // Pública a propósito y fuera de `RequiereUsuario`: es la que abre una
  // farmacia al escanear el QR de la credencial, y quien escanea no tiene —ni
  // debería necesitar— cuenta en el portal.
  { path: '/verificar/:numero', element: <Verificar /> },
  // Selector cliente/admin: fuera del PortalLayout porque es una pantalla
  // de transición y no necesita sidebar. El guard de rol está en el
  // AuthCallback (solo llega acá quien tiene ambos roles).
  {
    path: '/elegir-vista',
    element: (
      <RequiereUsuario>
        <ElegirVista />
      </RequiereUsuario>
    ),
  },
  // Rutas admin: layout propio con sidebar distinta. El AdminLayout re-valida
  // el rol en cada mount contra /api/me/roles, así nadie llega por URL directa.
  {
    path: '/admin',
    element: (
      <RequiereUsuario>
        <AdminLayout />
      </RequiereUsuario>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'negocio', element: <AdminNegocio /> },
      { path: 'vendedores', element: <AdminVendedores /> },
    ],
  },
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
      {
        path: 'perfil/completar',
        element: (
          <RequierePago>
            <PerfilCompletar />
          </RequierePago>
        ),
      },
      { path: 'planes', element: <Planes /> },
      { path: 'coberturas', element: <Coberturas /> },
      { path: 'familiares', element: <Familiares /> },
      { path: 'movimientos', element: <Movimientos /> },
      { path: 'cuenta', element: <Cuenta /> },
    ],
  },
];

// `basename` derivado del `base` de Vite. En dev es `/` → React Router no
// necesita basename. En staging/prod el portal se sirve bajo `/app/*`
// (ver apps/portal/vite.config.ts): sacamos el trailing slash y pasamos
// `basename: "/app"` para que los <Link>/useNavigate armen URLs correctas.
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export const router = createBrowserRouter(rutas, basePath ? { basename: basePath } : undefined);
