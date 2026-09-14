import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';

/** Dirección desde la que entra el bloque. `abajo` es la del 90% de los casos. */
export type VarianteRevelado = 'abajo' | 'lateral' | 'escala';

interface RevelarProps {
  children: ReactNode;
  /** Etiqueta a renderizar. `div` por defecto; usar la semántica real cuando la haya. */
  como?: ElementType;
  variante?: VarianteRevelado;
  /** Posición dentro de una cascada. Cada unidad suma 60ms de retraso. */
  indice?: number;
  className?: string;
}

/* Un solo observador para toda la página en vez de uno por bloque: son decenas
   de elementos y crear un IntersectionObserver por cada uno es desperdicio puro.
   Vive a nivel de módulo porque su ciclo de vida es el del documento. */
let observador: IntersectionObserver | null = null;

function obtenerObservador(): IntersectionObserver | null {
  // jsdom no implementa IntersectionObserver. Sin esta guarda, los 213 tests
  // del repo explotarían al montar cualquier página.
  if (typeof IntersectionObserver === 'undefined') return null;

  observador ??= new IntersectionObserver(
    (entradas) => {
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue;
        entrada.target.classList.add('revelado');
        // Se revela una sola vez: volver a ocultarlo al salir haría que la
        // página parpadee al scrollear hacia arriba.
        observador?.unobserve(entrada.target);
      }
    },
    // El -12% inferior evita que el bloque se revele cuando apenas asomó un
    // píxel: espera a que esté realmente entrando en cuadro.
    { rootMargin: '0px 0px -12% 0px', threshold: 0.1 },
  );

  return observador;
}

/**
 * Revela su contenido cuando entra en viewport.
 *
 * El estado oculto NO vive acá sino en `motion.css`, detrás de la clase `.js`
 * del documento y de `prefers-reduced-motion: no-preference`. Si el JS no
 * corre, este componente igual renderiza a sus hijos visibles.
 *
 * Con movimiento reducido queda sólo el fundido, sin desplazamiento.
 */
export function Revelar({ children, como: Como = 'div', variante = 'abajo', indice, className }: RevelarProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo) return;

    const obs = obtenerObservador();
    if (!obs) {
      // Sin IntersectionObserver (jsdom, navegadores muy viejos) se muestra
      // directo: nunca se deja contenido escondido esperando un evento que no
      // va a llegar.
      nodo.classList.add('revelado');
      return;
    }

    obs.observe(nodo);
    return () => obs.unobserve(nodo);
  }, []);

  return (
    <Como
      ref={ref}
      data-revelar={variante === 'abajo' ? '' : variante}
      className={className}
      style={indice === undefined ? undefined : ({ '--indice': indice } as CSSProperties)}
    >
      {children}
    </Como>
  );
}
