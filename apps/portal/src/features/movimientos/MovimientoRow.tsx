import { CreditCard, ShoppingBag } from 'lucide-react';
import type { Orden } from '@/mock/session';
import { formatearFecha } from '@/features/cobertura/contrataciones';
import { Icon } from '@/ui/Icon';
import { Chip } from '@/ui/Chip';
import { Money } from '@/ui/Money';

export interface MovimientoRowProps {
  orden: Orden;
}

/**
 * Fila tipo tabla sin header: `concepto | fecha | estado | monto`, todo
 * alineado en una sola línea con el grid-cols que fija las últimas tres
 * columnas a `auto` y deja la primera (concepto) tomando el resto.
 * Mobile cae a layout flex más denso que preserva la lectura en ancho corto.
 */
export function MovimientoRow({ orden }: MovimientoRowProps) {
  return (
    <li className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-4 py-4 sm:grid-cols-[auto_1fr_auto_auto_auto]">
      <Icon icono={orden.tipo === 'plan' ? CreditCard : ShoppingBag} tono="neutro" tamano="sm" />

      <span className="min-w-0 truncate text-sm font-medium text-ink-900">{orden.concepto}</span>

      <span className="hidden text-sm text-ink-500 tabular-nums sm:inline">
        {formatearFecha(orden.fecha)}
      </span>

      <Chip tono={orden.estado === 'pagada' ? 'ok' : 'warn'}>
        {orden.estado === 'pagada' ? 'Pagada' : 'Pendiente'}
      </Chip>

      <Money monto={orden.monto} />
    </li>
  );
}
