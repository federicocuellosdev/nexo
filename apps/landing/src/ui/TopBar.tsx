import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Estado visual de la barra, para que la marca pueda adaptar su color. */
export interface EstadoTopBar {
  /** `true` cuando la barra ya tiene fondo opaco (scrolleada, o siempre si no flota). */
  solida: boolean;
}

export interface TopBarProps {
  /**
   * Acepta un nodo o una función del estado. La función existe para el caso
   * de `sobreContenido`: sobre la foto del hero la marca va blanca, y sobre
   * la barra sólida vuelve al gradiente. Ese dato vive acá adentro, así que
   * la única forma limpia de exponerlo es pasándolo hacia afuera.
   */
  marca: ReactNode | ((estado: EstadoTopBar) => ReactNode);
  acciones?: ReactNode | ((estado: EstadoTopBar) => ReactNode);
  /**
   * Flota transparente sobre el contenido y se vuelve sólida al scrollear.
   * Para heros a sangre: una barra blanca opaca sobre una foto full-bleed
   * corta la imagen justo donde tiene que respirar.
   *
   * Por defecto `false`, que reproduce el comportamiento pegajoso opaco de
   * siempre. Ojo: el contenedor pasó de 1100 a 1200px para alinear con el
   * ancho editorial de la landing, así que el portal —que comparte este
   * archivo— gana 100px de barra. Es el único cambio que lo afecta, y se
   * unifica cuando le toque el rediseño.
   */
  sobreContenido?: boolean;
}

/** Barra superior pegajosa. La usan PublicLayout (landing) y PortalLayout (portal). */
export function TopBar({ marca, acciones, sobreContenido = false }: TopBarProps) {
  // Arranca sólida cuando no flota: así el render inicial del portal es idéntico
  // al de antes y no hay parpadeo de hidratación.
  const [solida, setSolida] = useState(!sobreContenido);
  const centinela = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Al navegar entre rutas, `sobreContenido` puede cambiar (ej. / → /catalogo).
    // Resetear `solida` al valor que corresponde al nuevo modo evita que la
    // barra arrastre el estado de la ruta anterior (home sobre foto →
    // catálogo sin foto quedaba transparente hasta scrollear).
    setSolida(!sobreContenido);

    if (!sobreContenido) return;

    const nodo = centinela.current;
    // Sin IntersectionObserver (jsdom) la barra queda sólida: legible siempre,
    // que es el fallback seguro.
    if (!nodo || typeof IntersectionObserver === 'undefined') {
      setSolida(true);
      return;
    }

    const obs = new IntersectionObserver(([entrada]) => setSolida(!entrada.isIntersecting), { threshold: 0 });
    obs.observe(nodo);
    return () => obs.disconnect();
  }, [sobreContenido]);

  const base = sobreContenido ? 'fixed inset-x-0 top-0' : 'sticky top-0';
  // Blanco sólido + sombra más pronunciada cuando la barra es "sólida":
  // el body también es claro (bg-app), un `shadow-sm` casi no se ve y la
  // barra se funde con el contenido. `shadow-md` + border más marcado la
  // despegan sin romper el estado transparente del hero.
  const fondo = solida
    ? 'border-b border-ink-200 bg-white shadow-[0_2px_8px_rgba(20,18,28,0.06)]'
    : 'border-b border-transparent bg-transparent';

  return (
    <>
      {/* Centinela de 1px en el tope del documento. Cuando sale de cuadro,
          la barra pasa a sólida. Se prefiere a un listener de scroll porque
          el observer no corre en cada frame de scroll.
          `fixed` + `pointer-events-none` lo saca del flujo: si vive en el
          flujo normal, con header `fixed` encima aparece una franja de 1px
          del bg del body (blanco) arriba del header — visible sobre el hero. */}
      {sobreContenido ? (
        <div
          ref={centinela}
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-0 h-px w-px"
        />
      ) : null}

      <header className={`${base} z-30 transition-[background-color,border-color] duration-200 ease-out-quart ${fondo}`}>
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-3 px-4 lg:h-16 lg:px-8">
          {typeof marca === 'function' ? marca({ solida }) : marca}
          {acciones ? (
            <div className="flex items-center gap-2">
              {typeof acciones === 'function' ? acciones({ solida }) : acciones}
            </div>
          ) : null}
        </div>
      </header>
    </>
  );
}
