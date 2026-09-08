import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { Tono } from '@/ui/tipos';

export interface BadgeProps {
  children: ReactNode;
  tono?: Tono;
  className?: string;
}

const TONOS: Record<Tono, string> = {
  marca: 'bg-marca-50 text-marca-700',
  ok: 'bg-ok-50 text-ok-700',
  warn: 'bg-warn-50 text-warn-700',
  danger: 'bg-danger-50 text-danger-700',
  neutro: 'bg-ink-100 text-ink-700',
};

/** Etiqueta sólida y compacta: "Recomendado", "Tu plan", "opcional · a definir". */
export function Badge({ children, tono = 'neutro', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        TONOS[tono],
        className,
      )}
    >
      {children}
    </span>
  );
}
