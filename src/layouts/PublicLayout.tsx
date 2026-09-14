import { Link, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { TopBar } from '@/ui/TopBar';
import { clasesBoton } from '@/ui/Button';
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
  // El hero a sangre sólo existe en la home: es la única ruta donde la barra
  // flota sobre una foto. En el resto arranca sólida desde el primer píxel.
  const heroASangre = useLocation().pathname === '/';

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

      <PieDeSitio />
    </div>
  );
}
