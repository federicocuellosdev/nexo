/**
 * Marcas de redes sociales como SVG inline.
 *
 * `lucide-react` 1.42 ya NO exporta iconos de marca (los quitaron por
 * cuestiones de marca registrada), y aproximarlos con un glifo genérico sería
 * peor que no ponerlos: nadie reconoce "Instagram" en un cuadrado con un
 * círculo cualquiera. Estos son los trazos oficiales, simplificados.
 *
 * Van sin `aria-label` propio: quien los usa pone el nombre accesible en el
 * `<a>` que los envuelve, así el lector de pantalla anuncia el enlace una sola
 * vez y no "Instagram, Instagram".
 */
export interface IconoRedProps {
  /** Lado del cuadro en px. El trazo se ajusta solo. */
  tamano?: number;
  className?: string;
}

const BASE = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
};

export function IconoInstagram({ tamano = 18, className }: IconoRedProps) {
  return (
    <svg {...BASE} width={tamano} height={tamano} className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconoFacebook({ tamano = 18, className }: IconoRedProps) {
  return (
    <svg {...BASE} width={tamano} height={tamano} className={className}>
      <path d="M15 3h-2.5A4.5 4.5 0 0 0 8 7.5V11H5v4h3v7h4v-7h3l1-4h-4V7.5a1 1 0 0 1 1-1H15z" />
    </svg>
  );
}

export function IconoLinkedIn({ tamano = 18, className }: IconoRedProps) {
  return (
    <svg {...BASE} width={tamano} height={tamano} className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
