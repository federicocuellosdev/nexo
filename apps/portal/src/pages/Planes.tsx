import { useNavigate } from 'react-router';
import { Check, CircleAlert } from 'lucide-react';
import { ON_DEMAND, PLANES, type Plan, type Producto } from '@/mock/planes';
import { PlanCard } from '@/features/planes/PlanCard';
import { iconoDeProducto } from '@/features/planes/iconoProducto';
import { planContratado, productosContratados } from '@/features/cobertura/contrataciones';
import { setSession, useSession, type TipoItem } from '@/mock/session';
import { Card } from '@/ui/Card';
import { CardHero } from '@/ui/CardHero';
import { Money } from '@/ui/Money';
import { Chip } from '@/ui/Chip';
import { Button } from '@/ui/Button';

export function Planes() {
  const sesion = useSession();
  const navegar = useNavigate();
  const activo = planContratado(sesion);
  const contratados = productosContratados(sesion);

  /**
   * Con el perfil ya completo no hace falta volver a pasar por la bienvenida:
   * el usuario sabe qué contrata y solo le falta pagar (spec §6).
   */
  function elegir(tipo: TipoItem, id: string) {
    setSession({ intent: { tipo, id } });
    void navegar(sesion.perfil !== undefined ? '/pago' : '/bienvenida');
  }

  return (
    <div data-entrada className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl text-ink-950">Planes y productos</h1>
        <p className="mt-1 text-sm text-ink-600">Cambiá de plan o sumá una cobertura adicional.</p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl text-ink-950">Planes</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANES.map((plan: Plan) => {
            const esElTuyo = activo?.slug === plan.slug;
            return (
              <PlanCard
                key={plan.slug}
                plan={plan}
                activo={esElTuyo}
                destacado={plan.recomendado === true}
                etiquetaCta={activo !== undefined ? 'Cambiar a este plan' : 'Contratar'}
                // Sin CTA en el plan propio: la badge "Tu plan" ya lo comunica y
                // ofrecer un botón sería invitar a recomprar lo mismo.
                onCta={esElTuyo ? undefined : (elegido) => elegir('plan', elegido.slug)}
              />
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl text-ink-950">Productos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ON_DEMAND.map((producto: Producto) => {
            const yaLoTiene = contratados.some((p) => p.id === producto.id);
            const icono = iconoDeProducto(producto.id);
            return (
              <Card key={producto.id} as="article" className="flex flex-col gap-3">
                {icono ? <CardHero icono={icono} /> : null}
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
                  {/*
                    Sin este corte la tarjeta ofrece "Contratar" sobre algo ya
                    contratado y genera una segunda orden pagada, invisible en
                    /coberturas porque productosContratados dedupea por itemId.
                  */}
                  {yaLoTiene ? (
                    <Chip tono="ok" icono={Check}>
                      Ya contratado
                    </Chip>
                  ) : (
                    <Button
                      variante="secundario"
                      ancho="full"
                      onClick={() => elegir('producto', producto.id)}
                    >
                      Contratar
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
