import { Bell, LayoutGrid, House, Receipt, ShieldCheck, User } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { TopBar } from '@/ui/TopBar';
import { BottomNav } from '@/ui/BottomNav';
import { Sidebar } from '@/ui/Sidebar';
import type { NavItem } from '@/ui/tipos';
import { resetSession, useSession } from '@/mock/session';
import { landingUrl } from '@/lib/urls';

export const ITEMS_PORTAL: NavItem[] = [
  { to: '/inicio', label: 'Inicio', icono: House },
  { to: '/planes', label: 'Planes', icono: LayoutGrid },
  { to: '/coberturas', label: 'Coberturas', icono: ShieldCheck },
  { to: '/movimientos', label: 'Movimientos', icono: Receipt },
  { to: '/cuenta', label: 'Cuenta', icono: User },
];

export function Marca() {
  return (
    <Link to="/inicio" className="font-display text-xl leading-none text-ink-950">
      nexo<span className="text-marca-500">.</span>
    </Link>
  );
}

function iniciales(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

export function PortalLayout() {
  const sesion = useSession();
  const usuario = sesion.usuario;

  // Enlace y no botón: la landing está en otro origen, es navegación de verdad.
  const cerrarSesion = (
    <a
      href={landingUrl()}
      onClick={() => resetSession()}
      className="flex items-center gap-3 rounded-campo px-3 py-2.5 text-sm font-medium text-ink-600 transition-colors duration-200 hover:bg-ink-50 hover:text-ink-900"
    >
      Cerrar sesión
    </a>
  );

  return (
    <div className="min-h-dvh bg-app">
      <Sidebar
        marca={<Marca />}
        items={ITEMS_PORTAL}
        pie={
          <div className="flex flex-col gap-1">
            <a
              href={landingUrl()}
              className="flex items-center gap-3 rounded-campo px-3 py-2.5 text-sm font-medium text-ink-600 transition-colors duration-200 hover:bg-ink-50 hover:text-ink-900"
            >
              Ver catálogo
            </a>
            {cerrarSesion}
          </div>
        }
      />

      <div className="lg:pl-64">
        {/* La barra superior es de mobile: en escritorio manda el Sidebar. */}
        <div className="lg:hidden">
          <TopBar
            marca={<Marca />}
            acciones={
              <>
                <button
                  type="button"
                  aria-label="Novedades"
                  className="inline-flex size-9 items-center justify-center rounded-pill text-ink-600 transition-colors duration-200 hover:bg-ink-100 hover:text-ink-900"
                >
                  <Bell size={18} strokeWidth={1.75} aria-hidden="true" />
                </button>
                <Link
                  to="/cuenta"
                  aria-label="Mi cuenta"
                  className="inline-flex size-9 items-center justify-center rounded-pill bg-brand text-xs font-semibold text-white"
                >
                  {usuario ? iniciales(usuario.nombre, usuario.apellido) : '—'}
                </Link>
              </>
            }
          />
        </div>

        {/* pb-24 en mobile deja aire para la BottomNav fija. */}
        <main className="mx-auto max-w-[1100px] px-4 pb-24 pt-6 lg:px-6 lg:pb-14 lg:pt-10">
          <Outlet />
        </main>
      </div>

      <BottomNav items={ITEMS_PORTAL} />
    </div>
  );
}
