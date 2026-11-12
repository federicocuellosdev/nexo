import { CreditCard, Receipt, ShoppingBag } from 'lucide-react';
import type { Orden } from '@/mock/session';
import { formatearFecha } from '@/features/cobertura/contrataciones';
import { Icon } from '@/ui/Icon';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';

/** Formato compacto para tabla: `$15.000` sin decimales. El `Money` con
 *  superíndice es para hero/pricing; acá roba ancho sin aportar info. */
function formatearMonto(monto: number): string {
  return `$${Math.round(monto).toLocaleString('es-AR')}`;
}

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
      {/* `table-fixed` + padding reducido en mobile (px-3) para que las 3
          columnas visibles entren sin scroll horizontal en 320px. La celda
          de Concepto se achica con `min-w-0 + truncate` para que el monto
          nunca quede recortado (el monto es el dato crítico de la fila). */}
      <table className="w-full table-fixed border-collapse text-left">
        <thead>
          <tr className="border-b border-ink-100 text-xs font-medium uppercase tracking-wide text-ink-500">
            <th scope="col" className="px-2 pb-3 pt-4 font-medium sm:px-5">
              Concepto
            </th>
            <th scope="col" className="hidden w-[7.5rem] px-5 pb-3 pt-4 text-center font-medium sm:table-cell">
              Fecha
            </th>
            <th scope="col" className="hidden w-[8rem] px-5 pb-3 pt-4 font-medium sm:table-cell">
              Estado
            </th>
            <th scope="col" className="w-[6rem] px-2 pb-3 pt-4 text-right font-medium sm:w-[8rem] sm:px-5">
              Monto
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {ordenes.map((orden) => (
            <tr key={orden.id} className="align-middle">
              <td className="min-w-0 px-2 py-4 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <Icon
                    icono={orden.tipo === 'plan' ? CreditCard : ShoppingBag}
                    tono="neutro"
                    tamano="sm"
                  />
                  <span className="min-w-0 truncate text-sm font-medium text-ink-900">
                    {orden.concepto}
                  </span>
                </div>
              </td>
              <td className="hidden px-5 py-4 text-center text-sm text-ink-600 tabular-nums sm:table-cell">
                {formatearFecha(orden.fecha)}
              </td>
              <td className="hidden px-5 py-4 sm:table-cell">
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
              <td className="whitespace-nowrap px-2 py-4 text-right text-sm font-semibold text-ok-700 tabular-nums sm:px-5">
                {formatearMonto(orden.monto)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
