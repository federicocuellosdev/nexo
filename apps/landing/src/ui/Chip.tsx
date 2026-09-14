import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Tono } from '@/ui/tipos';

export interface ChipProps {
  children: ReactNode;
  tono?: Tono;
  icono?: LucideIcon;
  className?: string;
}

const TONOS: Record<Tono, string> = {
  marca: 'border-marca-500/30 bg-marca-50 text-marca-700',
  ok: 'border-ok-500/30 bg-ok-50 text-ok-700',
  warn: 'border-warn-500/30 bg-warn-50 text-warn-700',
  danger: 'border-danger-500/30 bg-danger-50 text-danger-700',
  neutro: 'border-ink-200 bg-white text-ink-700',
};

/**
 * Chip de estado, con borde y icono opcional. Es el que lleva "a confirmar"
 * sobre los datos con `pendiente: true` (spec §8) y los estados de movimiento.
 */
export function Chip({ children, tono = 'neutro', icono: Glifo, className }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        TONOS[tono],
        className,
      )}
    >
      {Glifo ? <Glifo size={12} strokeWidth={2} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
