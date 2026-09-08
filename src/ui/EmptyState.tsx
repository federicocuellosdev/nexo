import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Icon } from '@/ui/Icon';

export interface EmptyStateProps {
  icono: LucideIcon;
  titulo: string;
  descripcion?: string;
  /** Acción opcional: un botón o un enlace. */
  children?: ReactNode;
}

export function EmptyState({ icono, titulo, descripcion, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card bg-white px-6 py-10 text-center shadow-suave ring-1 ring-ink-100">
      <Icon icono={icono} tono="neutro" />
      <h3 className="text-lg text-ink-900">{titulo}</h3>
      {descripcion ? <p className="max-w-sm text-sm text-ink-600">{descripcion}</p> : null}
      {children ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}
