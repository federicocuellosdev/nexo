import { CircleAlert } from 'lucide-react';
import type { Prestacion } from '@/mock/planes';
import { Chip } from '@/ui/Chip';
import { cn } from '@/lib/cn';
import { ETIQUETA, GLIFO, TONO } from '@/features/planes/estadoPrestacion';

export interface PlanPrestacionesProps {
  prestaciones: Prestacion[];
}

/**
 * Tabla de prestaciones del plan. Desktop usa `<table>` real (semántica
 * correcta para datos tabulares, mejor para lectores de pantalla y para copy
 * de la tabla a otro lado). Mobile cae en una lista apilada porque tres
 * columnas angostas se vuelven ilegibles en < 640px.
 */
export function PlanPrestaciones({ prestaciones }: PlanPrestacionesProps) {
  return (
    <>
      {/* Desktop: tabla con encabezados Prestación / Estado / Detalle.
          El borde inferior de cada row da ritmo visual; hover con bg-ink-50/50
          ayuda a seguir una fila larga sin perder el renglón. */}
      {/* Celdas sin padding horizontal en los extremos para que el texto de
          la primera columna arranque alineado con el h2 'Nexo III' y la
          última columna llegue hasta el borde derecho. La separación entre
          columnas intermedias sale del pr-6 de cada celda (menos la ultima). */}
      <table className="hidden w-full border-collapse text-left sm:table">
        <thead>
          <tr className="border-b border-ink-100 text-xs font-medium uppercase tracking-wide text-ink-500">
            <th scope="col" className="pb-3 pr-6 pt-2 font-medium">
              Prestación
            </th>
            <th scope="col" className="pb-3 pr-6 pt-2 font-medium">
              Estado
            </th>
            <th scope="col" className="pb-3 pt-2 font-medium">
              Detalle
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {prestaciones.map((prestacion) => (
            <tr key={prestacion.label} className="align-top">
              <td className="py-3 pr-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      prestacion.estado === 'no-incluido'
                        ? 'text-ink-400 line-through'
                        : 'text-ink-900',
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
              </td>
              <td className="py-3 pr-6">
                <Chip tono={TONO[prestacion.estado]} icono={GLIFO[prestacion.estado]}>
                  {ETIQUETA[prestacion.estado]}
                </Chip>
              </td>
              <td className="py-3 text-sm text-ink-600">
                {prestacion.detalle ?? <span className="text-ink-300">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile: cada prestación en su propia caja. El chip queda a la
          derecha del título en flex-wrap, y el detalle va debajo. */}
      <ul className="flex flex-col divide-y divide-ink-100 sm:hidden">
        {prestaciones.map((prestacion) => (
          <li key={prestacion.label} className="flex flex-col gap-2 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className={cn(
                  'text-sm font-medium',
                  prestacion.estado === 'no-incluido' ? 'text-ink-400 line-through' : 'text-ink-900',
                )}
              >
                {prestacion.label}
              </span>
              <Chip tono={TONO[prestacion.estado]} icono={GLIFO[prestacion.estado]}>
                {ETIQUETA[prestacion.estado]}
              </Chip>
            </div>
            {prestacion.pendiente ? (
              <Chip tono="warn" icono={CircleAlert}>
                a confirmar
              </Chip>
            ) : null}
            {prestacion.detalle ? (
              <p className="text-sm text-ink-600">{prestacion.detalle}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
