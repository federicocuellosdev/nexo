import type { LucideIcon } from 'lucide-react';
import { Check, CircleAlert, Minus, X } from 'lucide-react';
import type { EstadoPrestacion, Prestacion } from '@/mock/planes';
import type { Tono } from '@/ui/tipos';
import { Icon } from '@/ui/Icon';
import { Chip } from '@/ui/Chip';
import { cn } from '@/lib/cn';

const GLIFO: Record<EstadoPrestacion, LucideIcon> = {
  incluido: Check,
  coseguro: Minus,
  'no-incluido': X,
};

const TONO: Record<EstadoPrestacion, Tono> = {
  incluido: 'ok',
  coseguro: 'warn',
  'no-incluido': 'neutro',
};

const ETIQUETA: Record<EstadoPrestacion, string> = {
  incluido: 'Incluido',
  coseguro: 'Con coseguro',
  'no-incluido': 'No incluido',
};

export interface PlanPrestacionesProps {
  prestaciones: Prestacion[];
}

export function PlanPrestaciones({ prestaciones }: PlanPrestacionesProps) {
  return (
    <ul className="flex flex-col divide-y divide-ink-100">
      {prestaciones.map((prestacion) => (
        <li key={prestacion.label} className="flex items-start gap-3 py-3">
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
                  'text-base',
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
            {prestacion.detalle ? <p className="mt-0.5 text-sm text-ink-600">{prestacion.detalle}</p> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
