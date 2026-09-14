import { CircleAlert } from 'lucide-react';
import type { Plan } from '@/mock/planes';
import { Icon } from '@/ui/Icon';
import { Chip } from '@/ui/Chip';
import { cn } from '@/lib/cn';
import { ETIQUETA, GLIFO, TONO } from '@/features/planes/estadoPrestacion';

export interface PlanComparadorProps {
  actual: Plan;
  otros: Plan[];
}

/**
 * Una prestación que un plan NO nombra se muestra como `no-incluido`, no como
 * celda vacía: la ausencia no comunica, y acá se compara justamente eso.
 * Devolvemos la prestación completa (no solo el estado) porque también
 * necesitamos su flag `pendiente` para el chip "a confirmar" (spec §8).
 */
function prestacionDe(plan: Plan, label: string) {
  return plan.prestaciones.find((p) => p.label === label);
}

export function PlanComparador({ actual, otros }: PlanComparadorProps) {
  const columnas = [actual, ...otros];
  const etiquetas = Array.from(new Set(columnas.flatMap((plan) => plan.prestaciones.map((p) => p.label))));

  return (
    <div className="overflow-x-auto rounded-card bg-white shadow-card ring-1 ring-ink-100">
      <table className="w-full min-w-[420px] border-collapse text-left">
        <caption className="sr-only">Comparación de prestaciones entre los planes</caption>
        <thead>
          <tr className="border-b border-ink-100">
            <th scope="col" className="px-4 py-3 text-sm font-medium text-ink-600">
              Prestación
            </th>
            {columnas.map((plan, indice) => (
              <th
                key={plan.slug}
                scope="col"
                className={cn(
                  'px-3 py-3 text-center text-sm font-medium whitespace-nowrap',
                  indice === 0 ? 'text-marca-700' : 'text-ink-600',
                )}
              >
                {plan.nombre}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {etiquetas.map((etiqueta) => (
            <tr key={etiqueta} className="border-b border-ink-100 last:border-0">
              <th scope="row" className="px-4 py-3 text-sm font-normal text-ink-800">
                {etiqueta}
              </th>
              {columnas.map((plan) => {
                const prestacion = prestacionDe(plan, etiqueta);
                const estado = prestacion?.estado ?? 'no-incluido';
                return (
                  <td key={plan.slug} className="px-3 py-3">
                    <div className="flex flex-col items-center gap-1.5">
                      <Icon icono={GLIFO[estado]} tono={TONO[estado]} tamano="sm" etiqueta={ETIQUETA[estado]} />
                      {prestacion?.pendiente ? (
                        <Chip tono="warn" icono={CircleAlert}>
                          a confirmar
                        </Chip>
                      ) : null}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
