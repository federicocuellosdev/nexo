import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface CardProps {
  children: ReactNode;
  className?: string;
  /** Marca la card elegida (plan recomendado, plan activo): anillo de marca. */
  destacada?: boolean;
  as?: 'div' | 'article' | 'section';
}

export function Card({ children, className, destacada = false, as: Etiqueta = 'div' }: CardProps) {
  return (
    <Etiqueta
      className={cn(
        // `min-w-0` para que la card respete el ancho del grid padre y no
        // se pase por hijos con nowrap (CTAs con labels largos). Sin esto,
        // un botón "Ver Seguro de Hogar · hasta 1er piso" fuerza la card
        // a crecer y rompe el viewport mobile.
        //
        // Fondo: la variante destacada lleva un lavado violeta muy sutil
        // (marca-50) además del anillo, para que el "Recomendado" sea
        // lecturable sin tener que fijarse en el borde. Blanco en el resto.
        'min-w-0 rounded-card p-5 shadow-card',
        destacada ? 'bg-marca-50/60 ring-2 ring-marca-500' : 'bg-white ring-1 ring-ink-100',
        className,
      )}
    >
      {children}
    </Etiqueta>
  );
}
