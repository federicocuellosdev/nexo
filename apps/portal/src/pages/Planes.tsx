import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Check } from 'lucide-react';
import { ON_DEMAND, PLANES, type Plan, type Producto } from '@/mock/planes';
import { PlanCard } from '@/features/planes/PlanCard';
import { iconoDeProducto } from '@/features/planes/iconoProducto';
import { planContratado, productosContratados } from '@/features/cobertura/contrataciones';
import { setSession, useSession, type TipoItem } from '@/mock/session';
import { DialogoEmailMercadoPago } from '@/features/pago/DialogoEmailMercadoPago';
import { Card } from '@/ui/Card';
import { CardHero } from '@/ui/CardHero';
import { Money } from '@/ui/Money';
import { Chip } from '@/ui/Chip';
import { Button } from '@/ui/Button';

interface Pendiente {
  tipo: TipoItem;
  id: string;
}

export function Planes() {
  const sesion = useSession();
  const navegar = useNavigate();
  const activo = planContratado(sesion);
  const contratados = productosContratados(sesion);
  // Guarda el item que el usuario eligió contratar mientras el popup de
  // Mercado Pago está abierto. Al confirmar se dispara `elegir()` con estos
  // datos y se navega al checkout.
  const [pendiente, setPendiente] = useState<Pendiente | null>(null);

  /**
   * Con el perfil ya completo no hace falta volver a pasar por la bienvenida:
   * el usuario sabe qué contrata y solo le falta pagar (spec §6).
   */
  function elegir(tipo: TipoItem, id: string, emailPago: string) {
    setSession({ intent: { tipo, id }, emailPago });
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
                // ofrecer un botón sería invitar a recomprar lo mismo. Al elegir
                // se abre el popup de Mercado Pago (toda primera suscripción
                // arranca capturando la cuenta MP que recibirá el cobro).
                onCta={esElTuyo ? undefined : (elegido) => setPendiente({ tipo: 'plan', id: elegido.slug })}
              />
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        {/* Hoy los productos on demand están deshabilitados mientras el
            usuario no tenga un plan contratado: son complementos del plan,
            no un producto independiente. La oferta se muestra igual (precio,
            nombre, bajada) para que la persona la conozca; solo el CTA queda
            no accionable. */}
        <div className="flex flex-col gap-1 border-b border-ink-100 pb-4">
          <h2 className="font-display text-xl text-ink-950">Productos</h2>
          <p className="text-sm text-ink-500">
            Es necesario tener un plan contratado para acceder a estos servicios.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ON_DEMAND.map((producto: Producto) => {
            const yaLoTiene = contratados.some((p) => p.id === producto.id);
            const icono = iconoDeProducto(producto.id);
            return (
              <Card
                key={producto.id}
                as="article"
                // Card deshabilitada: bg gris + ring más marcado (ink-200)
                // para que el borde se note contra el bg-app, y bajada con
                // alto reservado para 2 líneas así todos los precios quedan
                // alineados verticalmente aunque las descripciones varíen.
                className="flex flex-col gap-3 !bg-ink-50 !ring-ink-200"
              >
                {icono ? <CardHero icono={icono} deshabilitado /> : null}
                <h3 className="text-lg font-medium text-ink-500">{producto.nombre}</h3>
                <p className="line-clamp-2 min-h-[2.5rem] text-sm text-ink-500">{producto.detalle}</p>
                <div className="flex flex-wrap items-center gap-2 text-ink-500">
                  <Money monto={producto.precio} periodo="por mes" className="!text-ink-500" />
                </div>
                <div className="mt-auto pt-1">
                  {yaLoTiene ? (
                    <Chip tono="ok" icono={Check}>
                      Ya contratado
                    </Chip>
                  ) : (
                    <Button variante="secundario" ancho="full" disabled>
                      Contratar
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {pendiente ? (
        <DialogoEmailMercadoPago
          onCerrar={() => setPendiente(null)}
          onConfirmar={(email) => {
            elegir(pendiente.tipo, pendiente.id, email);
            setPendiente(null);
          }}
        />
      ) : null}
    </div>
  );
}
