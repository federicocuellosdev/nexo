import { useSearchParams } from 'react-router';
import { ON_DEMAND, PLANES } from '@/mock/planes';
import { PlanCard } from '@/features/planes/PlanCard';
import { ProductoCard } from '@/features/planes/ProductoCard';
import { PlanComparador } from '@/features/planes/PlanComparador';
import { TabPanel, Tabs, type ItemTab } from '@/ui/Tabs';
import { Revelar } from '@/ui/Revelar';
import { EncabezadoSeccion } from '@/ui/EncabezadoSeccion';

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
    // Mismo ancho (1200) y mismo aire (py-20/28) que la home: es la pantalla
    // a la que se llega desde "Ver planes", así que si acá el ritmo cambia,
    // el clic se siente como caerse a otro sitio.
    <div className="mx-auto max-w-[1200px] px-4 py-20 lg:px-8 lg:py-28">
      <Revelar>
        <EncabezadoSeccion eyebrow="Todo junto" titulo="Catálogo" como="h1" />
      </Revelar>
      <Revelar>
        <p className="mt-6 max-w-[52ch] text-base text-ink-600">
          Planes mensuales y coberturas que se contratan aparte. Los precios son mensuales.
        </p>
      </Revelar>

      <div className="mt-12">
        <Tabs valor={pestana} onCambio={cambiarPestana} items={ITEMS} etiqueta="Catálogo">
          <TabPanel<Pestana> valor="planes">
            {/* Encabezado sólo para lectores de pantalla: las tarjetas traen un
                h3 y sin este h2 el documento saltaba de h1 a h3. Mismo patrón
                que ya usa el portal en Movimientos.tsx para sus paneles.
                Va oculto porque la pestaña activa ya dice visualmente qué se
                está mirando; repetirlo en pantalla sería ruido. */}
            <h2 className="sr-only">Planes mensuales</h2>
            {/* `h-full` en el envoltorio y en la tarjeta: el `align-items: stretch`
                de la grilla estira el wrapper de reveal pero no la tarjeta que
                lleva dentro, y las tres quedarían de alto distinto. */}
            <div data-revelar-grupo className="grid items-stretch gap-4 md:grid-cols-3">
              {PLANES.map((plan) => (
                <Revelar key={plan.slug} className="h-full [&>*]:h-full">
                  <PlanCard
                    plan={plan}
                    destacado={plan.recomendado === true}
                    hrefDetalle={`/planes/${plan.slug}`}
                    etiquetaCta={`Ver plan ${plan.nombre}`}
                  />
                </Revelar>
              ))}
            </div>

            <section aria-label="Comparación de planes" className="mt-20">
              <Revelar>
                <EncabezadoSeccion titulo="Comparalos de un vistazo" tamano="medio" />
              </Revelar>
              <Revelar className="mt-8">
                <PlanComparador
                  actual={RECOMENDADO}
                  otros={PLANES.filter((plan) => plan.slug !== RECOMENDADO.slug)}
                />
              </Revelar>
            </section>
          </TabPanel>

          <TabPanel<Pestana> valor="productos">
            <h2 className="sr-only">Productos on demand</h2>
            <div data-revelar-grupo className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ON_DEMAND.map((producto) => (
                <Revelar key={producto.id} className="h-full [&>*]:h-full">
                  <ProductoCard
                    producto={producto}
                    hrefDetalle={`/productos/${producto.id}`}
                    etiquetaCta={`Ver ${producto.nombre}`}
                  />
                </Revelar>
              ))}
            </div>
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
}
