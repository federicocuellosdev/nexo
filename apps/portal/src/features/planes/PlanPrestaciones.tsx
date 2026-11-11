import type { EstadoPrestacion, Prestacion } from '@/mock/planes';
import { Icon } from '@/ui/Icon';
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

// Orden visual: lo que el plan te DA primero (incluido), después lo que
// comparte el costo (coseguro), al final lo que NO tiene (no-incluido).
// Los `no-incluido` agrupados al pie dejan la tarjeta con el valor arriba
// y el "no" al final, que facilita comparar entre los 3 planes de un vistazo.
const PESO_ESTADO: Record<EstadoPrestacion, number> = {
  incluido: 0,
  coseguro: 1,
  'no-incluido': 2,
};

// Orden canónico de labels. Los 3 planes repiten las mismas prestaciones con
// distintos estados, así que si todos las muestran en el mismo orden la
// comparación fila a fila es inmediata. Las que no aparezcan en este map
// caen al final en el orden en que vinieron (estable gracias al index).
const PESO_LABEL: Record<string, number> = {
  'Seguro de Salud I': 0,
  'Seguro de Salud II': 1,
  'Emergencias médicas': 2,
  'Médico a domicilio': 3,
  'Guardia odontológica': 4,
  'Farmacia': 5,
  'Óptica': 6,
  'Doc24 · Clínica': 7,
  'Doc24 · Psicología': 8,
};

function ordenar(prestaciones: Prestacion[]): Prestacion[] {
  return [...prestaciones]
    .map((p, i) => ({ p, i }))
    .sort((a, b) => {
      const estado = PESO_ESTADO[a.p.estado] - PESO_ESTADO[b.p.estado];
      if (estado !== 0) return estado;
      const labelA = PESO_LABEL[a.p.label] ?? 99 + a.i;
      const labelB = PESO_LABEL[b.p.label] ?? 99 + b.i;
      return labelA - labelB;
    })
    .map(({ p }) => p);
}

export function PlanPrestaciones({ prestaciones, compacto = false }: PlanPrestacionesProps) {
  const ordenadas = ordenar(prestaciones);
  return (
    <ul className="flex flex-col divide-y divide-ink-100">
      {ordenadas.map((prestacion) => (
        <li key={prestacion.label} className={cn('flex items-start gap-3', compacto ? 'py-2.5' : 'py-3')}>
          <Icon
            icono={GLIFO[prestacion.estado]}
            tono={TONO[prestacion.estado]}
            tamano="sm"
            etiqueta={ETIQUETA[prestacion.estado]}
          />
          <div className="min-w-0 flex-1">
            <span
              className={cn(
                'block',
                compacto ? 'text-sm' : 'text-base',
                prestacion.estado === 'no-incluido' ? 'text-ink-400 line-through' : 'text-ink-900',
              )}
            >
              {prestacion.label}
            </span>
            {prestacion.detalle ? (
              <p className={cn('mt-0.5 text-ink-600', compacto ? 'text-xs' : 'text-sm')}>{prestacion.detalle}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
