import { useState } from 'react';
import { useNavigate } from 'react-router';
import { CircleAlert } from 'lucide-react';
import { ON_DEMAND, PLANES, type Plan, type Producto } from '@/mock/planes';
import { PlanCard } from '@/features/planes/PlanCard';
import { planContratado } from '@/features/cobertura/contrataciones';
import { setSession, useSession, type TipoItem } from '@/mock/session';
import { Tabs, TabPanel } from '@/ui/Tabs';
import { Card } from '@/ui/Card';
import { Money } from '@/ui/Money';
import { Chip } from '@/ui/Chip';
import { Button } from '@/ui/Button';

const ITEMS = [
  { valor: 'planes', label: 'Planes' },
  { valor: 'productos', label: 'Productos' },
];

export function Planes() {
  const sesion = useSession();
  const navegar = useNavigate();
  const [pestana, setPestana] = useState('planes');
  const activo = planContratado(sesion);

  /**
   * Con el perfil ya completo no hace falta volver a pasar por la bienvenida:
   * el usuario sabe qué contrata y solo le falta pagar (spec §6).
   */
  function elegir(tipo: TipoItem, id: string) {
    setSession({ intent: { tipo, id } });
    void navegar(sesion.perfil !== undefined ? '/pago' : '/bienvenida');
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl text-ink-950">Planes y productos</h1>
        <p className="mt-1 text-sm text-ink-600">Cambiá de plan o sumá una cobertura adicional.</p>
      </div>

      <Tabs valor={pestana} onCambio={setPestana} items={ITEMS} etiqueta="Planes y productos">
        <TabPanel valor="planes">
          <div className="grid gap-4 md:grid-cols-3">
            {PLANES.map((plan: Plan) => (
              <PlanCard
                key={plan.slug}
                plan={plan}
                activo={activo?.slug === plan.slug}
                destacado={plan.recomendado === true}
                etiquetaCta={activo?.slug === plan.slug ? 'Cambiar a este plan' : 'Contratar'}
                onCta={(elegido) => elegir('plan', elegido.slug)}
              />
            ))}
          </div>
        </TabPanel>

        <TabPanel valor="productos">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ON_DEMAND.map((producto: Producto) => (
              <Card key={producto.id} as="article" className="flex flex-col gap-3">
                <h3 className="text-lg font-medium text-ink-950">{producto.nombre}</h3>
                <p className="text-sm text-ink-600">{producto.detalle}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Money monto={producto.precio} periodo="por mes" />
                  {producto.pendiente ? (
                    <Chip tono="warn" icono={CircleAlert}>
                      a confirmar
                    </Chip>
                  ) : null}
                </div>
                <div className="mt-auto pt-1">
                  <Button variante="secundario" ancho="full" onClick={() => elegir('producto', producto.id)}>
                    Contratar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}
