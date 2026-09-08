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
  // El degradado de marca queda reservado a este CTA (spec §7).
  primario: 'bg-brand text-white shadow-card hover:shadow-elevada',
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
