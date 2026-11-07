import { Link, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { TopBar } from '@/ui/TopBar';
import { clasesBoton } from '@/ui/Button';
import { cn } from '@/lib/cn';
import { portalUrl } from '@/lib/urls';
import { LogoNexo, ETIQUETA_MARCA } from '@/ui/LogoNexo';
import { PieDeSitio } from '@/layouts/PieDeSitio';

/**
 * Logotipo real de marca. `LogoNexo` pinta el PNG con el gradiente de marca
 * vía `mask-image`, así que se ve bien sobre el TopBar y el pie blancos sin
 * necesitar una superficie oscura de por medio. El nombre accesible vive en
 * el `<Link>` (no en el logo) para no duplicarlo en el árbol de accesibilidad.
 *
 * Sobre la foto del hero (barra transparente) el gradiente de marca pierde
 * contraste, así que ahí se usa la variante blanca.
 */
export function Marca({ sobreFoto = false }: { sobreFoto?: boolean }) {
  return (
    <Link to="/" aria-label={ETIQUETA_MARCA} className="inline-flex items-center">
      <LogoNexo alto={22} etiqueta={null} variante={sobreFoto ? 'blanca' : 'marca'} />
    </Link>
  );
}

export function PublicLayout() {
  const pathname = useLocation().pathname;
  // Hay hero a sangre (foto full-bleed en el top) en la home y en las fichas
  // de plan/producto. En esas rutas la barra flota transparente sobre la foto
  // y se solidifica al scrollear. En el resto arranca sólida desde el primer
  // píxel, así el logo sale en color de marca y el fondo blanco se nota.
  const heroASangre = pathname === '/' || /^\/(planes|productos)\/[^/]+/.test(pathname);
  // En las fichas (plan o producto) y en el catálogo la propia página
  // expone su propio CTA de alta ("Contratar Nexo I", "Contratar Seguro de
  // Hogar"). Si además mostramos el CTA genérico del layout ("Ver planes de
  // salud"), se superponen y el genérico tapa al contextual, además de ser
  // redundante. En esas rutas lo ocultamos.
  const enFicha = /^\/(planes|productos)\/[^/]+/.test(pathname) || pathname === '/catalogo';

  return (
    <div className="flex min-h-dvh flex-col bg-app">
      {/* `createBrowserRouter` NO resetea el scroll al navegar: sin esto, hacer
          clic en un plan desde el pie de la home (scroll 3900) aterrizaba en la
          ficha en el scroll 1225, o sea a media página y sin ver el título.
          `ScrollRestoration` además DEVUELVE la posición al volver con el botón
          atrás, que es el comportamiento que la gente espera de un sitio. */}
      <ScrollRestoration />

      <TopBar
        sobreContenido={heroASangre}
        marca={({ solida }) => <Marca sobreFoto={!solida} />}
        acciones={({ solida }) => (
          // Mobile: solo "Ingresar". El CTA "Crear cuenta" vive en la barra
          // flotante inferior, y "Hablar con un vendedor" se oculta para
          // simplificar el header (está igualmente en el pie).
          // Desktop (sm+): se recupera la jerarquía completa izq→der:
          //   1. "Hablar con un vendedor" (fantasma)
          //   2. "Ingresar" (secundario)
          //   3. "Crear cuenta" (primario)
          // Sobre la foto del hero el fantasma violeta pierde contraste:
          // lo forzamos a texto blanco y hover translúcido.
          <>
            {/* Mobile: "Hablar con un vendedor" se oculta — está en el pie.
                El wrapper externo controla display sin pelear con el `inline-flex`
                del botón (nuestro `cn` no resuelve conflictos Tailwind). */}
            <span className="hidden sm:inline-flex">
              <a
                href="https://wa.me/5493415056130"
                target="_blank"
                rel="noopener noreferrer"
                className={clasesBoton({
                  variante: 'fantasma',
                  tamano: 'sm',
                  className: !solida ? 'text-white hover:bg-white/10' : undefined,
                })}
              >
                Hablar con un vendedor
              </a>
            </span>
            {/* Mobile: botón redondo solo con ícono de WhatsApp, al lado del
                Ingresar. Mismo look secundario (fondo blanco con borde) pero
                sin label — el "Hablar con un vendedor" completo vive en el
                header desktop y en el pie. */}
            <a
              href="https://wa.me/5493415056130"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Hablar con un vendedor por WhatsApp"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-900 transition-colors hover:border-ink-300 hover:bg-ink-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-500 sm:hidden"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
            {/* "Ingresar" sale del origen: el portal vive en OTRA app, así que
                es navegación de verdad (debe poder abrirse en pestaña nueva)
                y por eso va como `<a>`, no como `<Link>`. */}
            <a
              href={`${portalUrl()}/ingresar`}
              className={clasesBoton({ variante: 'secundario', tamano: 'sm' })}
            >
              Ingresar
            </a>
            {/* "Crear cuenta" en desktop vive acá; en mobile pasa al CTA
                flotante inferior. */}
            <span className="hidden sm:inline-flex">
              <Link to="/catalogo" className={clasesBoton({ tamano: 'sm' })}>
                Crear cuenta
              </Link>
            </span>
          </>
        )}
      />

      {/* Padding extra al final del main en mobile para que el contenido
          no quede tapado por la barra flotante inferior. En las fichas el
          padding ya lo pone la propia página (BarraAccionFija), así que
          no sumamos acá para no apilar aires muertos. En desktop (sm+) la
          barra no existe, así que recuperamos padding normal.
          `overflow-x-clip` evita que cualquier card/elemento con whitespace
          nowrap o ancho mínimo mayor que el viewport genere scroll horizontal
          en mobile — más seguro que `overflow-hidden` porque no crea un
          stacking context nuevo. */}
      <main className={cn('flex-1 overflow-x-clip sm:pb-0', !enFicha && 'pb-24')}>
        <Outlet />
      </main>

      <PieDeSitio />

      {/* CTA flotante mobile — "Ver planes de salud". Es el acceso principal
          al catálogo desde cualquier pantalla. Se oculta en sm+ porque allá
          el header ya tiene "Crear cuenta" + los CTAs del hero. También se
          oculta en las fichas de plan/producto: ahí la página ya expone su
          propio CTA contextual ("Contratar Nexo I") que abre el alta directo.
          Safe-area para iPhones con home indicator. */}
      {enFicha ? null : (
        <div
          className="fixed inset-x-0 bottom-0 z-20 border-t border-ink-100 bg-white/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:hidden"
          role="region"
          aria-label="Acción principal"
        >
          <Link
            to="/catalogo"
            className={clasesBoton({ tamano: 'lg', ancho: 'full' })}
          >
            Ver planes de salud
          </Link>
        </div>
      )}
    </div>
  );
}
