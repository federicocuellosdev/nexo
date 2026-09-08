import { Link, Outlet } from 'react-router';
import { TopBar } from '@/ui/TopBar';
import { clasesBoton } from '@/ui/Button';
import { portalUrl } from '@/lib/urls';

/** Logotipo. DM Serif Display, único lugar de la barra con tipografía display. */
export function Marca() {
  return (
    <Link to="/" className="font-display text-xl leading-none text-ink-950">
      nexo<span className="text-marca-500">.</span>
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
            {/* Texto distinto al del TopBar: dos enlaces con el mismo nombre accesible
                "Ingresar" en la misma página rompen la navegación por lector de pantalla
                (no se puede distinguir cuál es cuál) y el test de a11y que localiza el
                del TopBar por nombre único. */}
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
