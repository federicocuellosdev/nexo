import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Tono } from '@/ui/tipos';

export interface IconProps {
  icono: LucideIcon;
  tono?: Tono;
  tamano?: 'sm' | 'md' | 'lg';
  /** Si el icono aporta información (estado de una prestación), pasá el texto. */
  etiqueta?: string;
  className?: string;
}

const TONOS: Record<Tono, string> = {
  marca: 'bg-brand text-white',
  ok: 'bg-ok-50 text-ok-700',
  warn: 'bg-warn-50 text-warn-700',
  danger: 'bg-danger-50 text-danger-700',
  neutro: 'bg-ink-100 text-ink-600',
};

/** Glifo dentro de un círculo: el ladrillo de las listas del spec §7. */
export function Icon({ icono: Glifo, tono = 'neutro', tamano = 'md', etiqueta, className }: IconProps) {
  return (
    <span
      role={etiqueta ? 'img' : undefined}
      aria-label={etiqueta}
      aria-hidden={etiqueta ? undefined : true}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-pill',
        tamano === 'sm' ? 'size-8' : tamano === 'lg' ? 'size-20' : 'size-10',
        TONOS[tono],
        className,
      )}
    >
      <Glifo size={tamano === 'sm' ? 16 : tamano === 'lg' ? 32 : 20} strokeWidth={1.75} aria-hidden="true" />
    </span>
  );
}
