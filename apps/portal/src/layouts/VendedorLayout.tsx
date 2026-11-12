import { useEffect, useState } from 'react';
import { LayoutDashboard, Briefcase, Share2, ArrowLeftRight, LogOut } from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { Sidebar } from '@/ui/Sidebar';
import { TopBar } from '@/ui/TopBar';
import { BottomNav } from '@/ui/BottomNav';
import type { NavItem } from '@/ui/tipos';
import { LogoNexo, ETIQUETA_MARCA } from '@/ui/LogoNexo';
import { resetSession, useSession } from '@/mock/session';
import { iniciales, nombreVisible } from '@/lib/identidad';
import { supabase } from '@/lib/supabase';
import { obtenerMisRoles } from '@/lib/api';

function Marca() {
  return (
    <Link to="/vendedor/dashboard" aria-label={ETIQUETA_MARCA} className="inline-flex items-center">
      <LogoNexo alto={22} etiqueta={null} />
    </Link>
  );
}

const ITEMS_VENDEDOR: NavItem[] = [
  { to: '/vendedor/dashboard', label: 'Dashboard', icono: LayoutDashboard },
  { to: '/vendedor/negocio', label: 'Negocio', icono: Briefcase },
  { to: '/vendedor/onboarding', label: 'Onboarding', icono: Share2 },
];

/**
 * Layout del portal del vendedor. Mismo chrome que AdminLayout pero con nav
 * propia (Dashboard, Negocio, Onboarding) y chequeo de rol 'vendedor' en
 * cada cambio de ruta. Las páginas reusan los componentes del admin con
 * `fuente='vendedor'` — toda la data queda filtrada a sus propios leads
 * via los endpoints /vendedor/me/*.
 */
export function VendedorLayout() {
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const sesion = useSession();
  const [chequeando, setChequeando] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setChequeando(false);
      return;
    }
    let cancelado = false;
    void (async () => {
      try {
        const { data } = await supabase!.auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          if (!cancelado) navegar('/ingresar', { replace: true });
          return;
        }
        const roles = await obtenerMisRoles(token);
        if (cancelado) return;
        if (!roles.includes('vendedor')) {
          navegar('/inicio', { replace: true });
          return;
        }
        setChequeando(false);
      } catch (err) {
        console.warn('[VendedorLayout] no se pudo validar rol vendedor', err);
        if (!cancelado) navegar('/inicio', { replace: true });
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [navegar, ubicacion.pathname]);

  if (chequeando) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-app text-sm text-ink-600">
        Validando acceso…
      </div>
    );
  }

  const usuario = sesion.usuario;

  async function cerrarSesion() {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[VendedorLayout] signOut error', err);
      }
    }
    resetSession();
    navegar('/ingresar', { replace: true });
  }

  const identidad = (
    <div className="flex items-center gap-3 rounded-campo bg-ink-50 px-3 py-3">
      <span
        aria-hidden="true"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-pill bg-marca-600 text-xs font-semibold text-white"
      >
        {iniciales(usuario)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink-900">{nombreVisible(usuario)}</p>
        <p className="truncate text-xs text-ink-500">Vendedor</p>
      </div>
    </div>
  );

  const pie = (
    <div className="flex flex-col gap-1">
      <Link
        to="/elegir-vista"
        className="inline-flex items-center gap-2 rounded-campo px-3 py-2 text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-900"
      >
        <ArrowLeftRight size={16} aria-hidden="true" />
        Cambiar de vista
      </Link>
      <button
        type="button"
        onClick={() => void cerrarSesion()}
        className="inline-flex items-center gap-2 rounded-campo px-3 py-2 text-left text-sm text-ink-600 hover:bg-ink-50 hover:text-danger-700"
      >
        <LogOut size={16} aria-hidden="true" />
        Cerrar sesión
      </button>
    </div>
  );

  return (
    <div className="min-h-dvh bg-app">
      <Sidebar marca={<Marca />} items={ITEMS_VENDEDOR} identidad={identidad} pie={pie} />
      <div className="flex min-h-dvh flex-col lg:ml-64">
        <TopBar marca={null} />
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pt-6 pb-24 lg:px-8 lg:pt-10 lg:pb-16">
          <Outlet />
        </main>
        <BottomNav items={ITEMS_VENDEDOR} />
      </div>
    </div>
  );
}
