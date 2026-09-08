import { useSearchParams } from 'react-router';
import { ON_DEMAND, PLANES } from '@/mock/planes';
import { PlanCard } from '@/features/planes/PlanCard';
import { ProductoCard } from '@/features/planes/ProductoCard';
import { PlanComparador } from '@/features/planes/PlanComparador';
import { TabPanel, Tabs, type ItemTab } from '@/ui/Tabs';

type Pestana = 'planes' | 'productos';

const ITEMS: ItemTab<Pestana>[] = [
  { valor: 'planes', label: 'Planes' },
  { valor: 'productos', label: 'Productos' },
];

const RECOMENDADO = PLANES.find((plan) => plan.recomendado === true) ?? PLANES[0];

/**
 * La pestaña activa vive en la URL (`?tab=`), no en estado local: así el CTA
 * "Ver productos" del Home puede aterrizar directo en la pestaña Productos, y
 * el botón atrás del navegador respeta la pestaña que se estaba mirando.
 */
export function Catalogo() {
  const [parametros, setParametros] = useSearchParams();
  const pestana: Pestana = parametros.get('tab') === 'productos' ? 'productos' : 'planes';

  function cambiarPestana(valor: Pestana) {
    setParametros(valor === 'planes' ? {} : { tab: valor }, { replace: true });
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 lg:px-6 lg:py-14">
      <h1 className="text-2xl text-ink-950 lg:text-3xl">Catálogo</h1>
      <p className="mt-2 max-w-[52ch] text-sm text-ink-600">
        Planes mensuales y coberturas que se contratan aparte. Los precios son mensuales.
      </p>

      <div className="mt-6">
        <Tabs valor={pestana} onCambio={cambiarPestana} items={ITEMS} etiqueta="Catálogo">
          <TabPanel<Pestana> valor="planes">
            <div className="grid gap-4 md:grid-cols-3">
              {PLANES.map((plan) => (
                <PlanCard
                  key={plan.slug}
                  plan={plan}
                  destacado={plan.recomendado === true}
                  hrefDetalle={`/planes/${plan.slug}`}
                  etiquetaCta={`Ver plan ${plan.nombre}`}
                />
              ))}
            </div>

            <section aria-label="Comparación de planes" className="mt-10">
              <h2 className="text-xl text-ink-950">Comparalos de un vistazo</h2>
              <div className="mt-4">
                <PlanComparador
                  actual={RECOMENDADO}
                  otros={PLANES.filter((plan) => plan.slug !== RECOMENDADO.slug)}
                />
              </div>
            </section>
          </TabPanel>

          <TabPanel<Pestana> valor="productos">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ON_DEMAND.map((producto) => (
                <ProductoCard
                  key={producto.id}
                  producto={producto}
                  hrefDetalle={`/productos/${producto.id}`}
                  etiquetaCta={`Ver ${producto.nombre}`}
                />
              ))}
            </div>
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
}
