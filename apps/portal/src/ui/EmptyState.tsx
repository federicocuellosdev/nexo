import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Icon } from '@/ui/Icon';

export interface EmptyStateProps {
  icono: LucideIcon;
  titulo: string;
  descripcion?: string;
  /**
   * Nivel del encabezado. `h3` por defecto, que es el caso de un vacío DENTRO
   * de una pantalla que ya tiene su h1 y su h2.
   *
   * Pasá `h1` cuando el vacío ES la pantalla entera (404, "no encontramos ese
   * plan", "no hay una solicitud en curso"): si no, la página queda sin ningún
   * h1 y la jerarquía arranca en h3, salteando dos niveles. Quien navega por
   * encabezados con un lector de pantalla no encuentra el título de la página.
   */
  como?: 'h1' | 'h2' | 'h3';
  /** Acción opcional: un botón o un enlace. */
  children?: ReactNode;
}

const TAMANO_TITULO: Record<NonNullable<EmptyStateProps['como']>, string> = {
  h1: 'text-2xl',
  h2: 'text-xl',
  h3: 'text-lg',
};

export function EmptyState({ icono, titulo, descripcion, como: Titulo = 'h3', children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card bg-white px-6 py-10 text-center shadow-suave ring-1 ring-ink-100">
      <Icon icono={icono} tono="neutro" tamano="lg" />
      <Titulo className={`${TAMANO_TITULO[Titulo]} text-ink-900`}>{titulo}</Titulo>
      {descripcion ? <p className="max-w-sm text-sm text-ink-600">{descripcion}</p> : null}
      {children ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}
