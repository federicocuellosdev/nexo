import { useState } from 'react';
import { BotonPausa } from '@/ui/BotonPausa';

export interface FotoBanner {
  src: string;
  /**
   * Punto de interés del recorte, en formato `object-position`. La banda es
   * mucho más ancha que alta, así que el encuadre vertical se define foto por
   * foto para no cortar caras.
   */
  encuadre: string;
}

export interface BannerFotosProps {
  fotos: FotoBanner[];
}

/**
 * Banda de fotos a sangre que va alternando entre varias con un fundido.
 *
 * ALTO: la banda arrancó en 32svh y a ese tamaño sólo se veía el 43% de la
 * foto — el 57% quedaba recortado y las caras se cortaban. A 50/58svh se ve
 * cerca de dos tercios, que es lo que permite reconocer a la gente sin que la
 * banda se convierta en un segundo hero y le robe protagonismo al primero.
 *
 * Las fotos van apiladas y sólo cambia la opacidad: un fundido cruzado no
 * mueve nada de lugar, así que no compite con la lectura como sí lo haría un
 * desplazamiento. Todas se cargan de entrada (son tres), así que el cambio
 * nunca muestra un hueco.
 */
export function BannerFotos({ fotos }: BannerFotosProps) {
  const [enPausa, setEnPausa] = useState(false);

  return (
    // El contenedor NO lleva `aria-hidden`: adentro está el botón de pausa, y
    // un control enfocable dentro de un subárbol oculto es inalcanzable para
    // teclado y lector de pantalla. Lo decorativo son las IMÁGENES, y eso se
    // declara con `alt=""` en cada una.
    <div className="relative h-[50svh] overflow-hidden lg:h-[58svh]">
      {fotos.map((foto, indice) => (
        <img
          key={foto.src}
          src={foto.src}
          alt=""
          loading="lazy"
          data-fundido
          data-pausada={enPausa ? '' : undefined}
          // El retraso negativo escalona el ciclo: cada foto arranca su
          // animación ya avanzada, así que en cualquier momento hay una sola
          // visible sin necesidad de JS que las coordine.
          style={{ animationDelay: `${-indice * (18 / fotos.length)}s`, objectPosition: foto.encuadre }}
          className="absolute inset-0 size-full object-cover"
        />
      ))}

      <div aria-hidden="true" className="absolute inset-0 bg-ink-950/28" />

      <BotonPausa
        enPausa={enPausa}
        onAlternar={() => setEnPausa((previo) => !previo)}
        que="las fotos"
        className="absolute right-4 bottom-4"
      />
    </div>
  );
}
