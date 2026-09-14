import { Bell, LayoutGrid, House, Receipt, ShieldCheck, User } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router';
import { TopBar } from '@/ui/TopBar';
import { BottomNav } from '@/ui/BottomNav';
import { Sidebar } from '@/ui/Sidebar';
import type { NavItem } from '@/ui/tipos';
import { resetSession, useSession } from '@/mock/session';
import { landingUrl } from '@/lib/urls';
import { LogoNexo, ETIQUETA_MARCA } from '@/ui/LogoNexo';
import { iniciales, nombreVisible } from '@/lib/identidad';

export const ITEMS_PORTAL: NavItem[] = [
  { to: '/inicio', label: 'Inicio', icono: House },
  { to: '/planes', label: 'Planes', icono: LayoutGrid },
  { to: '/coberturas', label: 'Coberturas', icono: ShieldCheck },
  { to: '/movimientos', label: 'Movimientos', icono: Receipt },
  { to: '/cuenta', label: 'Cuenta', icono: User },
];

/**
 * Logotipo real de marca, el mismo que usa la landing: `LogoNexo` pinta el PNG
 * con el gradiente de marca vía `mask-image`.
 *
 * Antes acá vivía una marca textual (`nexo.` con el punto en marca-500) que era
 * un placeholder: el socio veía un logotipo distinto al del sitio público del
 * que venía. El nombre accesible va en el `<Link>` y no en el logo para no
 * duplicarlo en el árbol de accesibilidad.
 */
export function Marca() {
  return (
    <Link to="/inicio" aria-label={ETIQUETA_MARCA} className="inline-flex items-center">
      <LogoNexo alto={22} etiqueta={null} />
    </Link>
  );
}

/**
 * Rutas donde la pantalla tiene UN solo trabajo y la navegación estorba.
 *
 * En un checkout toda opción visible compite con la tarea: acá había 5 destinos
 * en la sidebar, "Ver catálogo", "Cerrar sesión" y —en mobile— una BottomNav
 * FIJA, o sea cinco enlaces en la zona del pulgar, a milímetros del botón de
 * pagar. Es el mismo criterio que aplican Stripe, Shopify y Mercado Pago.
 *
 * `/pago/exito` NO entra: es la SALIDA del checkout, el momento en el que se
 * quiere que la persona vuelva a la app. Ahí la navegación suma.
 *
 * Comparación exacta y no `startsWith`: con prefijos, `/pago/exito` caería
 * dentro de `/pago` y perdería su navegación justo cuando la necesita.
 */
const RUTAS_ENFOCADAS = new Set(['/bienvenida', '/pago', '/perfil/completar']);

export function PortalLayout() {
  const sesion = useSession();
  const usuario = sesion.usuario;
  const enfocado = RUTAS_ENFOCADAS.has(useLocation().pathname);

  if (enfocado) {
    return (
      <div className="min-h-dvh bg-app">
        {/* El logo ES la salida de emergencia, además de la marca: sin sidebar
            ni BottomNav, quien entre directo a /perfil/completar necesita
            alguna forma de irse que no sea terminar el trámite. */}
        {/* Logo CENTRADO, no alineado a la izquierda: cada pantalla de checkout
            trae su propio ancho interno (Pago y Bienvenida usan 560px dentro de
            estos 720), así que un logo pegado al borde del contenedor externo
            no alinea con nada. Centrado es además el patrón de checkout. */}
        <header className="border-b border-ink-100 bg-white">
          <div className="mx-auto flex h-14 max-w-[720px] items-center justify-center px-4 lg:h-16">
            <Marca />
          </div>
        </header>

        <main className="mx-auto max-w-[720px] px-4 py-10 lg:py-16">
          <Outlet />
        </main>
      </div>
    );
  }

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
        identidad={
          usuario ? (
            // Deliberadamente NO repite el plan ni su estado: eso ya lo muestra
            // la CoberturaCard de /inicio y /coberturas con mucha más
            // información. Acá va sólo de quién es la sesión.
            <Link
              to="/cuenta"
              className="flex items-center gap-3 rounded-campo px-3 py-2.5 transition-colors duration-200 ease-out-quart hover:bg-ink-50"
            >
              <span
                aria-hidden="true"
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-pill bg-marca-600 text-xs font-semibold text-white"
              >
                {iniciales(usuario)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink-900">
                  {nombreVisible(usuario)}
                </span>
                <span className="block truncate text-xs text-ink-500">Ver mi cuenta</span>
              </span>
            </Link>
          ) : null
        }
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
                {/* Violeta sólido, no el degradado: son iniciales blancas a
                    12px, el caso de contraste MÁS exigente que hay. El
                    degradado da entre 4.26:1 y 2.97:1 y WCAG AA pide 4.5:1;
                    `marca-600` da 5.82:1. */}
                <Link
                  to="/cuenta"
                  aria-label="Mi cuenta"
                  className="inline-flex size-9 items-center justify-center rounded-pill bg-marca-600 text-xs font-semibold text-white transition-colors duration-200 ease-out-quart hover:bg-marca-700"
                >
                  {iniciales(usuario)}
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
