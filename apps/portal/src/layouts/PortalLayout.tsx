import { useEffect } from 'react';
import { Bell, LayoutGrid, House, Receipt, ShieldCheck, Users } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router';
import { TopBar } from '@/ui/TopBar';
import { BottomNav } from '@/ui/BottomNav';
import { Sidebar } from '@/ui/Sidebar';
import type { NavItem } from '@/ui/tipos';
import { declientar, getSession, resetSession, setSession, useSession } from '@/mock/session';
import { landingUrl } from '@/lib/urls';
import { LogoNexo, ETIQUETA_MARCA } from '@/ui/LogoNexo';
import { iniciales, nombreVisible } from '@/lib/identidad';
import { obtenerUltimoLead } from '@/lib/api';
import { rutaDeshabilitada } from '@/lib/navDisponibilidad';
import { supabase } from '@/lib/supabase';

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

  // Sincroniza la sesion del portal con v3.leads en cada mount del layout.
  // Dos responsabilidades:
  //
  //   1. HIDRATAR datos faltantes (nombre, DNI, intent) desde el ultimo lead
  //      del email. Era el unico trabajo del efecto original: se ejecutaba
  //      solo cuando algo faltaba, para que la sidebar mostrara "Federico
  //      Cuellos" post-login sin importar que ruta se abriera primero.
  //
  //   2. INVALIDAR la sesion si el lead al que apunta `sesion.leadId` ya no
  //      existe en el backend. Caso real: borramos leads de staging durante
  //      un cleanup y el browser seguia pintando la cobertura del flujo
  //      anterior porque la sesion vive en sessionStorage, no en la DB. Sin
  //      este reset, el portal muestra estado fantasma indefinidamente.
  //
  // Guard de invalidacion: si la sesion tiene evidencia de contratacion
  // VIGENTE (leadId, pagoPendiente, o una orden pagada SIN devolucion
  // asociada) la validamos contra v3.leads. El perfil NO se chequea
  // porque `declientar()` lo preserva a proposito — no es evidencia de
  // cobertura vigente, es onboarding completado que queremos reusar en
  // la proxima contratacion. Las pagadas que ya tienen su `dev-<id>`
  // emparejada tampoco cuentan: la devolucion las cerro. Sin esta
  // doble guarda `declientar()` no seria idempotente y el useEffect
  // entraria en loop (consulta → declientar → consulta → ...).
  const emailUsuario = usuario?.email;

  // Verificacion dura del lado de Supabase Auth: si la sesion local tiene un
  // `usuario` pero Supabase ya no reconoce al user (fue borrado desde el
  // dashboard / API / purga de staging), hay que descolgar al cliente. Sin
  // esto el portal muestra la sesion fantasma indefinidamente aunque hagas
  // cleanup del backend. Solo corre una vez por mount y SOLO cuando hay
  // usuario en storage — si no hay nadie logueado, no tocamos Supabase.
  useEffect(() => {
    if (!supabase || !emailUsuario) return;
    let cancelado = false;
    void (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (cancelado) return;
      // `getUser()` devuelve 403 cuando el token esta huerfano (user deleted).
      // `data.user === null` tambien cubre el caso de sesion expirada sin
      // poder refrescar. En ambos casos: hard reset + landing.
      if (error || !data.user) {
        console.warn('[portal] auth session invalida, reset completo', error?.message);
        try {
          await supabase.auth.signOut();
        } catch {
          /* ignore: el user ya no existe, signOut puede fallar */
        }
        resetSession();
        window.location.href = landingUrl();
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [emailUsuario]);

  const tienePagadaPendienteDeDev = sesion.ordenes.some((o) => {
    if (o.tipo !== 'plan' || o.estado !== 'pagada') return false;
    const yaDevuelta = sesion.ordenes.some((d) => d.estado === 'devuelta' && d.id === `dev-${o.id}`);
    return !yaDevuelta;
  });
  const tieneEstadoContratacion =
    sesion.leadId !== undefined || sesion.pagoPendiente !== undefined || tienePagadaPendienteDeDev;
  const faltaNombre =
    usuario !== undefined && (usuario.nombre ?? '').trim() === '' && (usuario.apellido ?? '').trim() === '';
  const faltaDni = sesion.dniLead === undefined;
  const faltaIntent = sesion.intent === undefined;
  const necesitaHidratar = faltaNombre || faltaDni || faltaIntent;
  const debeConsultar = emailUsuario !== undefined && (necesitaHidratar || tieneEstadoContratacion);
  useEffect(() => {
    if (!debeConsultar) return;
    let cancelado = false;
    void (async () => {
      try {
        const lead = await obtenerUltimoLead(emailUsuario!);
        if (cancelado) return;
        if (lead === null) {
          if (tieneEstadoContratacion) {
            // Backend no reconoce al titular pero la sesion local todavia
            // tiene contratacion cacheada → "declientamos": el usuario sigue
            // logueado con su perfil completo (no rehace onboarding), pero
            // se le limpia ordenes/intent/pagoPendiente/leadId/numero de
            // afiliado. El portal pasa a `conCuentaSinPago` y pinta
            // "Elegí un plan" automáticamente.
            console.warn('[portal] lead no existe en backend, declientando');
            declientar();
          }
          return;
        }
        const sesionActual = getSession();
        const patch: Parameters<typeof setSession>[0] = {};
        // Patcheamos SOLO lo que falta: no pisamos nombre/apellido/intent ya
        // existentes, y agregamos dniLead si vino en el lead y todavía no
        // estaba en sesión.
        if (lead.titular && sesionActual.usuario) {
          const nombreVacio = (sesionActual.usuario.nombre ?? '').trim() === '';
          const apellidoVacio = (sesionActual.usuario.apellido ?? '').trim() === '';
          const telefonoVacio = (sesionActual.usuario.telefono ?? '').trim() === '';
          const telefonoLead = lead.titular.telefono ?? '';
          const hayQueActualizar =
            nombreVacio || apellidoVacio || (telefonoVacio && telefonoLead !== '');
          if (hayQueActualizar) {
            patch.usuario = {
              ...sesionActual.usuario,
              ...(nombreVacio ? { nombre: lead.titular.nombre } : {}),
              ...(apellidoVacio ? { apellido: lead.titular.apellido } : {}),
              ...(telefonoVacio && telefonoLead ? { telefono: telefonoLead } : {}),
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
        console.warn('[portal] no se pudo consultar v3.leads', err);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [emailUsuario, debeConsultar, tieneEstadoContratacion]);

  // Disponibilidad centralizada en `lib/navDisponibilidad.rutaDeshabilitada`.
  // Si aparece una ruta nueva, se agrega la regla ahí y se replica sola en
  // Sidebar, BottomNav y en los Accesos rápidos de /inicio.
  const items: NavItem[] = ITEMS_PORTAL_BASE.map((item) =>
    rutaDeshabilitada(sesion, item.to) ? { ...item, disabled: true } : item,
  );

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
            px-4 desde sm. pb-28 en mobile deja aire grande entre el contenido
            y la BottomNav (h-14 + safe-area) — sin esto las cards de la ultima
            seccion quedaban casi tocando el nav y se sentia agobiante.
            overflow-x-clip (NO hidden) evita que un carrusel interno propague
            scroll horizontal a la pagina SIN romper position:sticky de los
            hijos. `overflow-x-hidden` crea un scroll container y mata el
            sticky de la TarjetaPerfil en /cuenta — clip es la variante nueva
            especificamente para este caso. */}
        <main className="mx-auto max-w-[1100px] overflow-x-clip px-3 pb-28 pt-6 sm:px-4 lg:px-6 lg:pb-14 lg:pt-10">
          <Outlet />
        </main>
      </div>

      <BottomNav items={items} />
    </div>
  );
}
