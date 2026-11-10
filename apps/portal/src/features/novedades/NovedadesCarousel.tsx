import type { Novedad } from '@/mock/novedades';
import { cn } from '@/lib/cn';
import { Icon } from '@/ui/Icon';

export interface NovedadesCarouselProps {
  novedades: Novedad[];
  /** Handler para el CTA `invitar` (lo dispara la novedad de referidos). */
  onInvitar?: () => void;
}

/**
 * Carrusel por scroll nativo con `snap`: sin JS, sin librería y con el gesto
 * táctil del sistema operativo.
 *
 * El `tabIndex={0}` es necesario, no decorativo: sin él la pista queda
 * inalcanzable para quien navega solo con teclado. Chromium auto-focusea los
 * contenedores scrollables, pero es una heurística suya — Safari no lo hace.
 */
export function NovedadesCarousel({ novedades, onInvitar }: NovedadesCarouselProps) {
  if (novedades.length === 0) return null;

  return (
    <ul
      aria-label="Novedades"
      tabIndex={0}
      // `px-1 py-1` + `-mx-1 -my-1` dejan colchon para que el `shadow-card`
      // y el `ring-1` de las cards no queden recortados por el overflow:
      // el shadow se dibuja 1-2 px afuera del bounding box, y sin el
      // colchon la pared derecha del carrusel y el borde del main lo
      // comen (en mobile se veia clip, en desktop quedaba el borde
      // derecho cortado al rozar el edge de la grilla).
      className="-mx-1 -my-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 py-1 pb-5 sm:grid sm:snap-none sm:grid-cols-3 sm:gap-3 sm:pb-1"
    >
      {novedades.map((novedad) => (
        <li
          key={novedad.id}
          className={cn(
            'w-[280px] shrink-0 snap-start rounded-card p-4 shadow-card ring-1 sm:w-auto sm:shrink',
            novedad.tono === 'warn'
              ? 'bg-warn-50 ring-warn-500/40'
              : 'bg-white ring-ink-100',
          )}
        >
          {/* Fila superior: icono a la izquierda, CTA opcional (ej. '+ Invitar')
              pegado al margen derecho. Si no hay cta, el icono queda solo. */}
          <div className="flex items-center justify-between gap-3">
            <Icon
              icono={novedad.icono}
              tono={novedad.tono}
              tamano="lg"
              className={novedad.tono === 'warn' ? '!bg-warn-500/20' : undefined}
            />
            {novedad.cta ? (
              // CTA jerarquizado a tono con la card warn: bg warn-700 + texto
              // blanco + sombra suave. Es el único clickeable del bloque y
              // tiene que dominar visualmente sobre el icono y el texto.
              <button
                type="button"
                onClick={() => {
                  if (novedad.cta?.action === 'invitar') onInvitar?.();
                }}
                className="inline-flex h-9 cursor-pointer items-center justify-center rounded-pill bg-warn-700 px-4 text-sm font-medium text-white shadow-suave transition-colors hover:bg-warn-500"
              >
                {novedad.cta.label}
              </button>
            ) : null}
          </div>
          <h3 className="mt-4 text-lg font-medium text-ink-950">{novedad.titulo}</h3>
          <p className="mt-2 text-sm text-ink-600">{novedad.texto}</p>
        </li>
      ))}
    </ul>
  );
}
