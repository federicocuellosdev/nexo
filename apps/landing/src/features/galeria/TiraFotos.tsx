import { useState } from 'react';
import { BotonPausa } from '@/ui/BotonPausa';

export interface FotoTira {
  src: string;
  alt: string;
}

export interface TiraFotosProps {
  fotos: FotoTira[];
}

/**
 * Tira continua de fotos que se desplaza sola.
 *
 * Se eligió sobre un carrusel clásico a propósito: un carrusel ESCONDE el
 * material detrás de una interacción que casi nadie hace (el estudio de Notre
 * Dame midió 1% de clics, y el 84% de esos en la primera lámina). Acá todas
 * las fotos pasan solas, así que ninguna queda enterrada.
 *
 * ACCESIBILIDAD, y esto no es opcional: WCAG 2.2.2 (nivel A) exige un
 * mecanismo para pausar cualquier cosa que se mueva por más de cinco segundos
 * en paralelo con otro contenido. Pausar al pasar el mouse NO alcanza: no
 * existe para quien navega con teclado. Por eso hay un botón real.
 *
 * Con `prefers-reduced-motion` la tira no se mueve en absoluto: un desfile
 * infinito es exactamente el tipo de movimiento que dispara vértigo.
 */
export function TiraFotos({ fotos }: TiraFotosProps) {
  const [enPausa, setEnPausa] = useState(false);

  return (
    <div className="group relative">
      {/* `mask-image` desvanece los bordes: sin esto las fotos aparecen y
          desaparecen de golpe contra el borde de la pantalla, que se lee como
          un corte y no como un desplazamiento continuo. */}
      <div
        className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
      >
        <ul
          data-tira
          data-pausada={enPausa ? '' : undefined}
          className="flex w-max gap-4"
        >
          {/* La lista va DUPLICADA para que el bucle sea continuo: la animación
              desplaza exactamente el 50%, así que al terminar la primera copia
              la segunda está justo donde arrancó la primera y el salto es
              invisible. La copia lleva `aria-hidden` para que un lector de
              pantalla no anuncie todo dos veces. */}
          {[0, 1].map((copia) => (
            <li key={copia} aria-hidden={copia === 1 ? true : undefined} className="flex shrink-0 gap-4">
              {fotos.map((foto) => (
                <img
                  key={foto.src}
                  src={foto.src}
                  // Decorativas: la tira aporta clima, no información. El texto
                  // de la sección ya dice de qué se trata, y describir 12
                  // imágenes seguidas sería ruido para un lector de pantalla.
                  alt=""
                  loading="lazy"
                  className="h-64 w-auto shrink-0 rounded-card object-cover lg:h-80"
                />
              ))}
            </li>
          ))}
        </ul>
      </div>

      <BotonPausa
        enPausa={enPausa}
        onAlternar={() => setEnPausa((previo) => !previo)}
        que="el desplazamiento"
        className="absolute right-4 bottom-4"
      />
    </div>
  );
}
