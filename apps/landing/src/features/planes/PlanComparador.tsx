import type { EstadoPrestacion, Plan } from '@/mock/planes';
import { Icon } from '@/ui/Icon';
import { cn } from '@/lib/cn';
import { ETIQUETA, GLIFO, TONO } from '@/features/planes/estadoPrestacion';

export interface PlanComparadorProps {
  actual: Plan;
  otros: Plan[];
}

/**
 * Una prestación que un plan NO nombra se muestra como `no-incluido`, no como
 * celda vacía: la ausencia no comunica, y acá se compara justamente eso.
 */
function prestacionDe(plan: Plan, label: string) {
  return plan.prestaciones.find((p) => p.label === label);
}

// Peso del estado para el ordenamiento visual: verdes primero, amarillas,
// grises al final. Es el mismo criterio que usa PlanPrestaciones.
const PESO: Record<EstadoPrestacion, number> = {
  incluido: 0,
  coseguro: 1,
  'no-incluido': 2,
};

export function PlanComparador({ actual, otros }: PlanComparadorProps) {
  // Las columnas se ordenan por slug (nexo-1, nexo-2, nexo-3) para que el ojo
  // lea de izquierda a derecha en orden lógico de plan. El plan `actual`
  // (recomendado) deja de ocupar la primera posición: lo seguimos destacando
  // por color en el header, pero su lugar en la tabla es el que le toca.
  const columnas = [actual, ...otros].sort((a, b) => a.slug.localeCompare(b.slug));
  const labelsOriginales = Array.from(
    new Set(columnas.flatMap((plan) => plan.prestaciones.map((p) => p.label))),
  );

  // Orden visual: primero las verdes del plan actual, después las amarillas,
  // al final las grises. Ordenar por el estado del plan ACTUAL (primera
  // columna) hace que la comparación quede alineada con la decisión de
  // compra — "esto es lo que te da el plan destacado, esto no".
  // Desempate por la suma de pesos en TODAS las columnas: entre dos filas
  // que son grises en el actual, sube la que al menos otro plan te da.
  const etiquetas = [...labelsOriginales]
    .map((label, orden) => {
      const estadoActual = PESO[prestacionDe(actual, label)?.estado ?? 'no-incluido'];
      const sumaOtros = otros.reduce(
        (acc, plan) => acc + PESO[prestacionDe(plan, label)?.estado ?? 'no-incluido'],
        0,
      );
      return { label, estadoActual, sumaOtros, orden };
    })
    .sort((a, b) => a.estadoActual - b.estadoActual || a.sumaOtros - b.sumaOtros || a.orden - b.orden)
    .map(({ label }) => label);

  return (
    <div className="overflow-x-auto rounded-card bg-white shadow-card ring-1 ring-ink-100">
      <table className="w-full min-w-[420px] border-collapse text-left">
        <caption className="sr-only">Comparación de prestaciones entre los planes</caption>
        <thead className="bg-ink-100">
          <tr className="border-b border-ink-200">
            <th scope="col" className="px-4 py-3 text-sm font-medium text-ink-700">
              Prestación
            </th>
            {columnas.map((plan) => (
              <th
                key={plan.slug}
                scope="col"
                className={cn(
                  'px-3 py-3 text-center text-sm font-semibold whitespace-nowrap',
                  plan.slug === actual.slug ? 'text-marca-700' : 'text-ink-800',
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
