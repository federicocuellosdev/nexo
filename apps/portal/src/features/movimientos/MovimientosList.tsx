import { CreditCard, Receipt, ShoppingBag } from 'lucide-react';
import type { Orden } from '@/mock/session';
import { formatearFecha } from '@/features/cobertura/contrataciones';
import { Icon } from '@/ui/Icon';
import { Chip } from '@/ui/Chip';
import { Money } from '@/ui/Money';
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

/**
 * Lista de movimientos como tabla real: encabezados arriba (CONCEPTO / FECHA /
 * ESTADO / MONTO), filas con el icono + texto bien distribuidos a lo largo del
 * ancho. Fecha va en el centro (col 2 con 1fr), estado y monto a la derecha.
 * Mobile oculta la fecha porque con cuatro columnas el ancho se vuelve
 * ilegible.
 */
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
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-ink-100 text-xs font-medium uppercase tracking-wide text-ink-500">
            <th scope="col" className="px-5 pb-3 pt-4 font-medium">
              Concepto
            </th>
            <th scope="col" className="hidden px-5 pb-3 pt-4 text-center font-medium sm:table-cell">
              Fecha
            </th>
            <th scope="col" className="px-5 pb-3 pt-4 font-medium">
              Estado
            </th>
            <th scope="col" className="px-5 pb-3 pt-4 text-right font-medium">
              Monto
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {ordenes.map((orden) => (
            <tr key={orden.id} className="align-middle">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <Icon
                    icono={orden.tipo === 'plan' ? CreditCard : ShoppingBag}
                    tono="neutro"
                    tamano="sm"
                  />
                  <span className="truncate text-sm font-medium text-ink-900">{orden.concepto}</span>
                </div>
              </td>
              <td className="hidden px-5 py-4 text-center text-sm text-ink-600 tabular-nums sm:table-cell">
                {formatearFecha(orden.fecha)}
              </td>
              <td className="px-5 py-4">
                <Chip
                  tono={
                    orden.estado === 'pagada'
                      ? 'ok'
                      : orden.estado === 'devuelta'
                        ? 'neutro'
                        : 'warn'
                  }
                >
                  {orden.estado === 'pagada'
                    ? 'Pagada'
                    : orden.estado === 'devuelta'
                      ? 'Devuelta'
                      : 'Pendiente'}
                </Chip>
              </td>
              <td className="px-5 py-4 text-right">
                <Money monto={orden.monto} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
