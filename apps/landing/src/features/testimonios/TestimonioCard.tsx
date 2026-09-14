import { useId, useState } from 'react';
import { ChevronDown, Quote } from 'lucide-react';
import { LARGO_VISTA_PREVIA, type Testimonio } from '@/mock/testimonios';

export interface TestimonioCardProps {
  testimonio: Testimonio;
}

/** Iniciales del autor, para el avatar. Cae a "—" si el nombre viniera vacío. */
function iniciales(autor: string): string {
  const partes = autor.trim().split(/\s+/).filter(Boolean);
  const letras = `${partes[0]?.charAt(0) ?? ''}${partes[1]?.charAt(0) ?? ''}`;
  return letras === '' ? '—' : letras.toUpperCase();
}

/**
 * Recorta en el último espacio antes del límite, no a mitad de palabra.
 * Cortar en seco ("...En la mayoría de los casos to") se lee como un error de
 * carga, no como una vista previa.
 */
function vistaPrevia(texto: string): string {
  if (texto.length <= LARGO_VISTA_PREVIA) return texto;
  const cortado = texto.slice(0, LARGO_VISTA_PREVIA);
  const ultimoEspacio = cortado.lastIndexOf(' ');
  return `${cortado.slice(0, ultimoEspacio > 0 ? ultimoEspacio : LARGO_VISTA_PREVIA).trimEnd()}…`;
}

/**
 * Testimonio de un socio.
 *
 * Semántica de cita real: `<blockquote>` para el texto y `<figcaption>` con
 * `<cite>` para quién lo dijo. No es decoración — es lo que permite que un
 * lector de pantalla anuncie "cita" y su autoría, en vez de leer un párrafo
 * suelto seguido de un nombre sin relación aparente.
 *
 * El ícono de comillas SÍ conserva el degradado de marca: no lleva texto ni
 * glifo de contenido encima que deba cumplir contraste. El avatar en cambio
 * va en `marca-600` sólido, porque ahí sí hay iniciales blancas (el degradado
 * daba entre 4.26:1 y 2.97:1, y WCAG AA pide 4.5:1).
 */
export function TestimonioCard({ testimonio }: TestimonioCardProps) {
  const [expandido, setExpandido] = useState(false);
  const idTexto = useId();

  const esLargo = testimonio.texto.length > LARGO_VISTA_PREVIA;
  const visible = expandido || !esLargo ? testimonio.texto : vistaPrevia(testimonio.texto);

  return (
    <figure className="flex h-full flex-col rounded-card bg-white p-6 shadow-card ring-1 ring-ink-100">
      <span
        aria-hidden="true"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-campo bg-brand text-white"
      >
        <Quote size={20} strokeWidth={2} />
      </span>

      <blockquote id={idTexto} className="mt-5 flex-1 text-base text-ink-700">
        {/* Las comillas tipográficas van en el texto y no como pseudo-elemento
            para que se copien junto con la cita al seleccionarla. */}
        <p>{`“${visible}”`}</p>
      </blockquote>

      {esLargo ? (
        <button
          type="button"
          onClick={() => setExpandido((previo) => !previo)}
          aria-expanded={expandido}
          aria-controls={idTexto}
          className="mt-3 inline-flex w-fit items-center gap-1 text-sm font-medium text-marca-600 transition-colors duration-200 ease-out-quart hover:text-marca-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-500"
        >
          {expandido ? 'Ver menos' : 'Ver más'}
          <ChevronDown
            size={16}
            strokeWidth={2}
            aria-hidden="true"
            className={`transition-transform duration-200 ease-out-quart motion-reduce:transition-none ${
              expandido ? 'rotate-180' : ''
            }`}
          />
        </button>
      ) : null}

      <figcaption className="mt-6 flex items-center gap-3 border-t border-ink-100 pt-5">
        <span
          aria-hidden="true"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-pill bg-marca-600 text-xs font-semibold text-white"
        >
          {iniciales(testimonio.autor)}
        </span>
        <span className="min-w-0">
          <cite className="block truncate text-sm font-semibold text-ink-950 not-italic">{testimonio.autor}</cite>
          <span className="block truncate text-sm text-ink-500">{testimonio.antiguedad}</span>
        </span>
      </figcaption>
    </figure>
  );
}
