import { Receipt } from 'lucide-react';
import type { Orden } from '@/mock/session';
import { MovimientoRow } from '@/features/movimientos/MovimientoRow';
import { EmptyState } from '@/ui/EmptyState';

export type FiltroMovimientos = 'todos' | 'pagos' | 'contrataciones';

export const FILTROS: readonly { valor: FiltroMovimientos; label: string }[] = [
  { valor: 'todos', label: 'Todos' },
  { valor: 'pagos', label: 'Pagos' },
  { valor: 'contrataciones', label: 'Contrataciones' },
];

/**
 * "Pagos" son las cuotas del plan y "Contrataciones" los servicios on demand:
 * los dos filtros particionan la lista sin dejar movimientos afuera.
 */
export function filtrarMovimientos(ordenes: Orden[], filtro: FiltroMovimientos): Orden[] {
  if (filtro === 'todos') return ordenes;
  if (filtro === 'pagos') return ordenes.filter((orden) => orden.tipo === 'plan');
  return ordenes.filter((orden) => orden.tipo === 'producto');
}

export interface MovimientosListProps {
  ordenes: Orden[];
}

export function MovimientosList({ ordenes }: MovimientosListProps) {
  if (ordenes.length === 0) {
    return (
      <EmptyState
        icono={Receipt}
        titulo="Todavía no hay movimientos"
        descripcion="Acá van a aparecer tus pagos y contrataciones."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-card bg-white shadow-card ring-1 ring-ink-100">
      <ul className="divide-y divide-ink-100">
        {ordenes.map((orden) => (
          <MovimientoRow key={orden.id} orden={orden} />
        ))}
      </ul>
    </div>
  );
}
