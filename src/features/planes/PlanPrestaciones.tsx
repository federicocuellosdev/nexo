import { CircleAlert } from 'lucide-react';
import type { Prestacion } from '@/mock/planes';
import { Icon } from '@/ui/Icon';
import { Chip } from '@/ui/Chip';
import { cn } from '@/lib/cn';
import { ETIQUETA, GLIFO, TONO } from '@/features/planes/estadoPrestacion';

export interface PlanPrestacionesProps {
  prestaciones: Prestacion[];
  /**
   * Versión apretada para las tarjetas de plan: sin líneas divisorias y con
   * menos aire vertical. La ficha de plan usa la versión normal, donde la
   * lista ES el contenido y puede respirar.
   */
  compacto?: boolean;
}

export function PlanPrestaciones({ prestaciones, compacto = false }: PlanPrestacionesProps) {
  return (
    <ul className={cn('flex flex-col', compacto ? 'gap-3' : 'divide-y divide-ink-100')}>
      {prestaciones.map((prestacion) => (
        <li key={prestacion.label} className={cn('flex items-start gap-3', compacto ? '' : 'py-3')}>
          <Icon
            icono={GLIFO[prestacion.estado]}
            tono={TONO[prestacion.estado]}
            tamano="sm"
            etiqueta={ETIQUETA[prestacion.estado]}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  compacto ? 'text-sm' : 'text-base',
                  prestacion.estado === 'no-incluido' ? 'text-ink-400 line-through' : 'text-ink-900',
                )}
              >
                {prestacion.label}
              </span>
              {prestacion.pendiente ? (
                <Chip tono="warn" icono={CircleAlert}>
                  a confirmar
                </Chip>
              ) : null}
            </div>
            {prestacion.detalle ? (
              <p className={cn('mt-0.5 text-ink-600', compacto ? 'text-xs' : 'text-sm')}>{prestacion.detalle}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
