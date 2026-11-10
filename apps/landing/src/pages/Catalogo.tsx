import { useSearchParams, useNavigate } from 'react-router';
import { ON_DEMAND, PLANES, type Plan, type Producto } from '@/mock/planes';
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
  const navegar = useNavigate();
  const pestana: Pestana = parametros.get('tab') === 'productos' ? 'productos' : 'planes';

  function cambiarPestana(valor: Pestana) {
    setParametros(valor === 'planes' ? {} : { tab: valor }, { replace: true });
  }

  // "Contratar X" ya no abre popup: navega a /contratar/:tipo/:id. La página
  // destino arma el flujo de dos pasos con la misma gramática visual del
  // PerfilWizard del portal — más espacio, sin modal y con URL referible.
  function irAAltaPlan(plan: Plan) {
    void navegar(`/contratar/plan/${plan.slug}`);
  }

  function irAAltaProducto(producto: Producto) {
    void navegar(`/contratar/producto/${producto.id}`);
  }

  return (
    // Mismo ancho (1200) que la home. Padding superior ajustado para que
    // el título quede más cerca del header. Reducimos el aire en ambos
    // breakpoints — pedido reiterado de diseño.
    <div className="mx-auto max-w-[1200px] px-4 pt-5 pb-20 lg:px-8 lg:pt-12 lg:pb-28">
      <Revelar>
        <EncabezadoSeccion eyebrow="Todo junto" titulo="Catálogo" como="h1" />
      </Revelar>
      <Revelar>
        {/* `text-pretty` reparte el quiebre de línea para evitar que la
            última palabra quede sola (viuda). `son mensuales.` suma un
            non-breaking space como refuerzo para los engines que todavía no
            soportan text-wrap:pretty. */}
        <p className="mt-6 max-w-[52ch] text-base text-ink-600 text-pretty">
          Planes mensuales y coberturas que se contratan aparte. Los precios son&nbsp;mensuales.
        </p>
      </Revelar>

      {/* Divisor tenue entre la introducción y los tabs: al ocupar el ancho
          completo del contenedor marca visualmente el fin del "encabezado"
          y el inicio del contenido explorable. */}
      <hr className="mt-10 border-0 border-t border-ink-200" aria-hidden="true" />

      {/* El contenedor de tabs entra con la misma animación de revelado que
          usan el resto de secciones; así el componente no "aparece" seco
          mientras el título ya terminó su transición. */}
      <Revelar className="mt-8">
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
                    onCta={irAAltaPlan}
                    etiquetaCta={`Contratar ${plan.nombre}`}
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
                    onCta={irAAltaProducto}
                    etiquetaCta={`Contratar ${producto.nombre}`}
                  />
                </Revelar>
              ))}
            </div>
          </TabPanel>
        </Tabs>
      </Revelar>

    </div>
  );
}
