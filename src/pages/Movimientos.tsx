import { useState } from 'react';
import { useSession } from '@/mock/session';
import {
  filtrarMovimientos,
  FILTROS,
  MovimientosList,
  type FiltroMovimientos,
} from '@/features/movimientos/MovimientosList';
import { TabPanel, Tabs } from '@/ui/Tabs';

export function Movimientos() {
  const sesion = useSession();
  const [filtro, setFiltro] = useState<FiltroMovimientos>('todos');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl text-ink-950">Mis movimientos</h1>
        <p className="mt-1 text-sm text-ink-600">Pagos de cuotas y contrataciones de productos.</p>
      </div>

      <Tabs
        valor={filtro}
        onCambio={(valor) => setFiltro(valor)}
        items={FILTROS.map((f) => ({ valor: f.valor, label: f.label }))}
        etiqueta="Filtrar movimientos"
      >
        {FILTROS.map((f) => (
          <TabPanel key={f.valor} valor={f.valor}>
            <MovimientosList ordenes={filtrarMovimientos(sesion.ordenes, f.valor)} />
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
}
