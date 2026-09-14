import { CreditCard, ShoppingBag } from 'lucide-react';
import type { Orden } from '@/mock/session';
import { formatearFecha } from '@/features/cobertura/contrataciones';
import { Icon } from '@/ui/Icon';
import { Chip } from '@/ui/Chip';
import { Money } from '@/ui/Money';

export interface MovimientoRowProps {
  orden: Orden;
}

/** Fila tipo actividad: icono en círculo, concepto, chip de estado y monto (spec §7). */
export function MovimientoRow({ orden }: MovimientoRowProps) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <Icon icono={orden.tipo === 'plan' ? CreditCard : ShoppingBag} tono="neutro" tamano="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink-900">{orden.concepto}</p>
        <p className="text-xs text-ink-500">{formatearFecha(orden.fecha)}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Money monto={orden.monto} />
        <Chip tono={orden.estado === 'pagada' ? 'ok' : 'warn'}>
          {orden.estado === 'pagada' ? 'Pagada' : 'Pendiente'}
        </Chip>
      </div>
    </li>
  );
}
