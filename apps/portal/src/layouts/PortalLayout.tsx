import { useEffect } from 'react';
import { Bell, LayoutGrid, House, Receipt, ShieldCheck, Users } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router';
import { TopBar } from '@/ui/TopBar';
import { BottomNav } from '@/ui/BottomNav';
import { Sidebar } from '@/ui/Sidebar';
import type { NavItem } from '@/ui/tipos';
import { getSession, resetSession, setSession, useSession } from '@/mock/session';
import { landingUrl } from '@/lib/urls';
import { LogoNexo, ETIQUETA_MARCA } from '@/ui/LogoNexo';
import { iniciales, nombreVisible } from '@/lib/identidad';
import { obtenerUltimoLead } from '@/lib/api';

/**
 * Items base del menú principal. `Planes` queda siempre activo (es el
 * punto de contratación); `Coberturas` y `Movimientos` se grisan cuando el
 * usuario todavía no contrató nada, para no mandarlo a pantallas vacías.
 * "Cuenta" NO está en el menú: se accede desde el bloque de identidad
 * (avatar + nombre) de la sidebar y desde el avatar del header mobile.
 */
const ITEMS_PORTAL_BASE: NavItem[] = [
  { to: '/inicio', label: 'Inicio', icono: House },
  { to: '/planes', label: 'Planes', icono: LayoutGrid },
  { to: '/coberturas', label: 'Coberturas', icono: ShieldCheck },
  { to: '/familiares', label: 'Familiares', icono: Users },
  { to: '/movimientos', label: 'Movimientos', icono: Receipt },
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

  // Hidratar datos del alta desde v3.leads cuando la sesión no los tiene
  // (caso típico post-login). Vive en el layout y no en /inicio para que la
  // sidebar muestre "Federico Cuellos" apenas se entra al portal, sin importar
  // qué ruta se abra primero.
  //
  // Se fetchea si falta CUALQUIERA de los tres: nombre, DNI o intent. Antes
  // solo se gateaba por `faltaNombre`, lo que dejaba sin sincronizar el DNI
  // (y por lo tanto el `dniLead` nunca se seteaba) en sesiones que ya tenían
  // el nombre pero no el documento. Resultado: `/perfil/completar` arrancaba
  // en paso 1 y `/cuenta` mostraba el documento vacío.
  const emailUsuario = usuario?.email;
  const faltaNombre =
    usuario !== undefined && (usuario.nombre ?? '').trim() === '' && (usuario.apellido ?? '').trim() === '';
  const faltaDni = sesion.dniLead === undefined;
  const faltaIntent = sesion.intent === undefined;
  const necesitaHidratar = emailUsuario !== undefined && (faltaNombre || faltaDni || faltaIntent);
  useEffect(() => {
    if (!necesitaHidratar) return;
    let cancelado = false;
    void (async () => {
      try {
        const lead = await obtenerUltimoLead(emailUsuario!);
        if (cancelado || lead === null) return;
        const sesionActual = getSession();
        const patch: Parameters<typeof setSession>[0] = {};
        // Patcheamos SOLO lo que falta: no pisamos nombre/apellido/intent ya
        // existentes, y agregamos dniLead si vino en el lead y todavía no
        // estaba en sesión.
        if (lead.titular && sesionActual.usuario) {
          const nombreVacio = (sesionActual.usuario.nombre ?? '').trim() === '';
          const apellidoVacio = (sesionActual.usuario.apellido ?? '').trim() === '';
          if (nombreVacio || apellidoVacio) {
            patch.usuario = {
              ...sesionActual.usuario,
              ...(nombreVacio ? { nombre: lead.titular.nombre } : {}),
              ...(apellidoVacio ? { apellido: lead.titular.apellido } : {}),
            };
          }
        }
        if (sesionActual.intent === undefined) {
          patch.intent = { tipo: lead.tipo, id: lead.id };
        }
        if (sesionActual.dniLead === undefined && lead.titular?.dni) {
          patch.dniLead = lead.titular.dni;
        }
        if (Object.keys(patch).length > 0) setSession(patch);
      } catch (err) {
        console.warn('[portal] no se pudo hidratar desde el lead', err);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [emailUsuario, necesitaHidratar]);

  // Todos los items del menú quedan siempre activos. En algún momento
  // probamos deshabilitar Coberturas y Movimientos mientras no hubiera plan
  // contratado, pero resulta más útil que la persona pueda navegarlos y vea
  // su propio EmptyState con guía ("todavía no tenés movimientos", etc.) en
  // vez de un ítem grisado sin explicación.
  const items: NavItem[] = ITEMS_PORTAL_BASE;

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
        items={items}
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
        pie={<div className="flex flex-col gap-1">{cerrarSesion}</div>}
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

        {/* px-3 en xs (360 px de ref) para dar +8 px de ancho util al contenido,
            px-4 desde sm. pb-20 matchea la BottomNav de h-14 + safe-area. */}
        <main className="mx-auto max-w-[1100px] px-3 pb-20 pt-6 sm:px-4 lg:px-6 lg:pb-14 lg:pt-10">
          <Outlet />
        </main>
      </div>

      <BottomNav items={items} />
    </div>
  );
}
