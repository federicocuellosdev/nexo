import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type VarianteBoton = 'primario' | 'secundario' | 'fantasma' | 'peligro';
export type TamanoBoton = 'sm' | 'md' | 'lg';

export interface OpcionesBoton {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  ancho?: 'auto' | 'full';
  className?: string;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, OpcionesBoton {
  children: ReactNode;
}

const BASE = [
  'inline-flex items-center justify-center gap-2 rounded-pill font-medium whitespace-nowrap',
  'transition-[background-color,box-shadow,color,transform] duration-200 ease-out-expo',
  'motion-safe:active:scale-[0.98]',
  'disabled:pointer-events-none disabled:opacity-50',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-500',
].join(' ');

const VARIANTES: Record<VarianteBoton, string> = {
  /* Violeta SÓLIDO, no el degradado de marca. Dos razones, y la primera no es
     de gusto:

     1. Contraste. Con texto blanco, el degradado `#8660ef → #ee5cd0` daba
        4.26:1 en su inicio, 3.64:1 en el medio y 2.97:1 en el extremo rosa:
        falla WCAG AA (4.5:1) en TODA su extensión. `marca-600` da 5.82:1 y
        `marca-700` del hover, 7.98:1. Ojo que `marca-500` —el violeta de
        marca— tampoco alcanza: 4.26:1.
     2. Un degradado que aparece siete veces en una misma pantalla (3 CTA de
        plan + hero + iconos) deja de ser un acento y pasa a ser el fondo.

     El degradado sigue existiendo como utilidad y vive donde tiene sentido:
     en el logotipo, que ES la marca. Ver la nota en tokens.css. */
  primario: 'bg-marca-600 text-white shadow-suave hover:bg-marca-700 hover:shadow-card',
  secundario: 'bg-white text-ink-900 border border-ink-200 hover:border-ink-300 hover:bg-ink-50',
  fantasma: 'bg-transparent text-marca-600 hover:bg-marca-50',
  peligro: 'bg-white text-danger-700 border border-danger-500/30 hover:bg-danger-50',
};

const TAMANOS: Record<TamanoBoton, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-base',
  lg: 'h-13 px-6 text-base',
};

/**
 * Las mismas clases del botón, sin el `<button>`. La usan los `<Link>` y `<a>`
 * que tienen que verse como CTA: navegar con un `<button onClick>` rompe
 * "abrir en pestaña nueva" y el foco del teclado.
 */
export function clasesBoton({
  variante = 'primario',
  tamano = 'md',
  ancho = 'auto',
  className,
}: OpcionesBoton = {}): string {
  return cn(BASE, VARIANTES[variante], TAMANOS[tamano], ancho === 'full' && 'w-full', className);
}

export function Button({
  variante = 'primario',
  tamano = 'md',
  ancho = 'auto',
  className,
  type = 'button',
  children,
  ...resto
}: ButtonProps) {
  return (
    <button type={type} className={clasesBoton({ variante, tamano, ancho, className })} {...resto}>
      {children}
    </button>
  );
}
