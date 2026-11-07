import { useSession } from '@/mock/session';
import { MovimientosList } from '@/features/movimientos/MovimientosList';

export function Movimientos() {
  const sesion = useSession();

  return (
    <div data-entrada className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl text-ink-950">Mis movimientos</h1>
        <p className="mt-1 text-sm text-ink-600">Pagos de cuotas y contrataciones de productos.</p>
      </div>

      {/* h2 oculto que soporta la jerarquía del documento (h1 → h2 → h3) sin
          agregar ruido visual: antes lo aportaba el `<TabPanel>` activo, pero
          sacamos los tabs porque la lista ya es cronológica y la segmentación
          la hace el ícono por tipo en cada fila. */}
      <h2 className="sr-only">Todos</h2>
      <MovimientosList ordenes={sesion.ordenes} />
    </div>
  );
}
