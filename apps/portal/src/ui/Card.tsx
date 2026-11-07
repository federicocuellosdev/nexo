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
        'rounded-card bg-white p-5 shadow-card',
        destacada ? 'ring-2 ring-marca-500' : 'ring-1 ring-ink-200',
        className,
      )}
    >
      {children}
    </Etiqueta>
  );
}
