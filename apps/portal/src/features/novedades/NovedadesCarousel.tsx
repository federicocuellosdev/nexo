import type { Novedad } from '@/mock/novedades';
import { cn } from '@/lib/cn';
import { Icon } from '@/ui/Icon';

export interface NovedadesCarouselProps {
  novedades: Novedad[];
}

/**
 * Carrusel por scroll nativo con `snap`: sin JS, sin librería y con el gesto
 * táctil del sistema operativo.
 *
 * El `tabIndex={0}` es necesario, no decorativo: sin él la pista queda
 * inalcanzable para quien navega solo con teclado. Chromium auto-focusea los
 * contenedores scrollables, pero es una heurística suya — Safari no lo hace.
 */
export function NovedadesCarousel({ novedades }: NovedadesCarouselProps) {
  if (novedades.length === 0) return null;

  return (
    // Desktop (sm+): grid de columnas iguales que ocupa todo el contenedor —
    // sin carrusel, se ve la novedad entera de un vistazo. Mobile: carrusel
    // con scroll + snap, porque tres cards apiladas rompen la jerarquía del
    // resto de la pantalla.
    <ul
      aria-label="Novedades"
      tabIndex={0}
      className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0"
    >
      {novedades.map((novedad) => (
        <li
          key={novedad.id}
          className={cn(
            'w-[280px] shrink-0 snap-start rounded-card p-4 shadow-card ring-1 sm:w-auto sm:shrink',
            // Warn (ej. referidos "en preparación") lleva fondo + borde a tono
            // para destacarlo como aviso, no promoción. Los otros van en
            // blanco para que la foto editorial del aviso no compita con el
            // dato del plan.
            novedad.tono === 'warn'
              ? 'bg-warn-50 ring-warn-500/40'
              : 'bg-white ring-ink-100',
          )}
        >
          <Icon icono={novedad.icono} tono={novedad.tono} tamano="lg" />
          <h3 className="mt-4 text-lg font-medium text-ink-950">{novedad.titulo}</h3>
          <p className="mt-2 text-sm text-ink-600">{novedad.texto}</p>
        </li>
      ))}
    </ul>
  );
}
