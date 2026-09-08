import { Link, Outlet } from 'react-router';
import { TopBar } from '@/ui/TopBar';
import { clasesBoton } from '@/ui/Button';
import { portalUrl } from '@/lib/urls';
import { LogoNexo, ETIQUETA_MARCA } from '@/ui/LogoNexo';

/**
 * Logotipo real de marca. `LogoNexo` pinta el PNG con el gradiente de marca
 * vía `mask-image`, así que se ve bien sobre el TopBar y el pie blancos sin
 * necesitar una superficie oscura de por medio. El nombre accesible vive en
 * el `<Link>` (no en el logo) para no duplicarlo en el árbol de accesibilidad.
 */
export function Marca() {
  return (
    <Link to="/" aria-label={ETIQUETA_MARCA} className="inline-flex items-center">
      <LogoNexo alto={22} etiqueta={null} />
    </Link>
  );
}

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-app">
      <TopBar
        marca={<Marca />}
        acciones={
          // Enlace y no botón: el portal vive en OTRO origen, así que esto es
          // navegación de verdad y tiene que poder abrirse en pestaña nueva.
          <a href={`${portalUrl()}/ingresar`} className={clasesBoton({ variante: 'secundario', tamano: 'sm' })}>
            Ingresar
          </a>
        }
      />

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-ink-100 bg-white">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-4 px-4 py-10 text-sm text-ink-600 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="flex flex-col gap-1">
            <Marca />
            <p>Previnca Salud · Rosario, Santa Fe</p>
          </div>
          <nav aria-label="Enlaces del pie" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/catalogo" className="hover:text-ink-900">
              Catálogo
            </Link>
            {/* Texto distinto al del TopBar. Ojo, la regla NO es "nunca repetir un nombre
                accesible": el logo (arriba y en el pie) repite "Nexo — Previnca Salud" a
                propósito porque los dos van al mismo destino (WCAG 3.2.4 pide justamente
                esa consistencia). Acá el caso es otro: "Ingresar" arriba abre el LOGIN y
                "Ingresar al portal" en el pie es la MISMA acción, pero si tuvieran el
                mismo nombre corto ("Ingresar" x2) un lector de pantalla que salta por
                nombre no podría distinguir cuál está tocando; por eso el del pie lleva
                el texto más largo. */}
            <a href={`${portalUrl()}/ingresar`} className="hover:text-ink-900">
              Ingresar al portal
            </a>
          </nav>
          <p className="text-xs text-ink-500">
            Maqueta de demostración. Precios y prestaciones sujetos a confirmación.
          </p>
        </div>
      </footer>
    </div>
  );
}
