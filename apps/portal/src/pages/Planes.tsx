import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Check, ShieldCheck } from 'lucide-react';
import { buscarPlan, buscarProducto, ON_DEMAND, PLANES, type Plan, type Producto } from '@/mock/planes';
import { PlanCard } from '@/features/planes/PlanCard';
import { iconoDeProducto } from '@/features/planes/iconoProducto';
import { planContratado, productosContratados, proximoVencimiento } from '@/features/cobertura/contrataciones';
import { CoberturaEstado } from '@/features/cobertura/CoberturaEstado';
import { derivarEstado } from '@/lib/estado';
import { setSession, useSession, type TipoItem } from '@/mock/session';
import { crearSuscripcion } from '@/lib/api';
import { DialogoEmailMercadoPago } from '@/features/pago/DialogoEmailMercadoPago';
import { Card } from '@/ui/Card';
import { CardHero } from '@/ui/CardHero';
import { Icon } from '@/ui/Icon';
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
  const estado = derivarEstado(sesion);
  const vencimiento = proximoVencimiento(sesion);
  // Guarda el item que el usuario eligió contratar mientras el popup de
  // Mercado Pago está abierto. Al confirmar se dispara `elegir()` con estos
  // datos y se navega al checkout.
  const [pendiente, setPendiente] = useState<Pendiente | null>(null);
  // Con cobertura activa la grilla de planes queda oculta por default; solo
  // la revelamos al tocar 'Subir de plan'. Sin cobertura la mostramos directo
  // porque elegir plan ES la tarea principal de la pantalla.
  const [mostrarPlanes, setMostrarPlanes] = useState(false);

  /**
   * Con el perfil ya completo no hace falta volver a pasar por la bienvenida:
   * el usuario sabe qué contrata y solo le falta pagar (spec §6). Crea el
   * preapproval, abre el checkout de MP en una pestaña nueva y navega a /pago
   * — que, al ver `pagoPendiente` en sesión, se hidrata directo en el estado
   * "Esperando tu pago" con el spinner y el polling. Si MP está caído o no
   * configurado, cae a /pago (mock) para no bloquear el flujo.
   */
  async function elegir(tipo: TipoItem, id: string, emailPago: string) {
    setSession({ intent: { tipo, id }, emailPago });

    const item =
      tipo === 'plan'
        ? buscarPlan(id)
        : buscarProducto(id);
    if (!item) {
      void navegar(sesion.perfil !== undefined ? '/pago' : '/bienvenida');
      return;
    }

    try {
      const { preapprovalId, initPoint } = await crearSuscripcion({
        planId: id,
        planNombre: item.nombre,
        monto: item.precio,
        emailMp: emailPago,
      });
      // Nueva pestaña: el checkout de MP vive en su dominio y el portal se
      // queda abierto para que el usuario vuelva sin perder su estado.
      window.open(initPoint, '_blank', 'noopener,noreferrer');
      setSession({
        pagoPendiente: {
          preapprovalId,
          tipo,
          itemId: id,
          nombre: item.nombre,
          monto: item.precio,
          emailMp: emailPago,
          checkoutUrl: initPoint,
        },
      });
      void navegar('/pago');
    } catch (err) {
      console.warn('[planes] no se pudo crear la suscripcion, cayendo al mock', err);
      void navegar(sesion.perfil !== undefined ? '/pago' : '/bienvenida');
    }
  }

  return (
    <div data-entrada className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl text-ink-950">Planes y productos</h1>
        <p className="mt-1 text-sm text-ink-600">Cambiá de plan o sumá una cobertura adicional.</p>
      </div>

      {/* Grilla de planes solo visible cuando el usuario toca 'Subir de plan'.
          Con cobertura activa la pantalla queda centrada en los productos; el
          upgrade pasa a ser una acción opcional, no el contenido principal. */}
      {activo === undefined || mostrarPlanes ? (
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
                  // Sin CTA en el plan propio: la badge "Tu plan" ya lo
                  // comunica y ofrecer un botón sería invitar a recomprar lo
                  // mismo. Al elegir, si ya tenemos emailPago (segunda+
                  // suscripción) saltamos al checkout; si no, abrimos el
                  // popup para capturarlo.
                  onCta={
                    esElTuyo
                      ? undefined
                      : (elegido) => {
                          if (sesion.emailPago) {
                            void elegir('plan', elegido.slug, sesion.emailPago);
                          } else {
                            setPendiente({ tipo: 'plan', id: elegido.slug });
                          }
                        }
                  }
                />
              );
            })}
          </div>
        </section>
      ) : (
        <section>
          {/* Mismo header que /coberturas (icono XL + nombre | Activa + próxima
              cuota) pero con UN solo CTA: 'Subir de plan' jerarquizado con el
              brand gradient. Sin 'Otros servicios' — esta pantalla ya los
              muestra abajo. */}
          <Card className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <Icon icono={ShieldCheck} tono="marca" tamano="lg" />
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl text-ink-950">{activo.nombre}</h2>
                  <span aria-hidden="true" className="text-ink-300">|</span>
                  <CoberturaEstado estado={estado} />
                </div>
                {vencimiento ? (
                  <p className="text-sm text-ink-500">{`Próxima cuota: ${vencimiento}`}</p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col gap-2 lg:basis-2/5 lg:shrink-0">
              <button
                type="button"
                onClick={() => setMostrarPlanes(true)}
                className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-pill bg-brand-oscurecido px-5 text-base font-medium text-white shadow-elevada transition-colors"
              >
                Subir de plan
              </button>
            </div>
          </Card>
        </section>
      )}

      <section className="flex flex-col gap-4">
        {/* Los productos on demand se habilitan cuando el usuario ya tiene un
            plan contratado: son complementos, no un producto independiente.
            Sin plan, la oferta se muestra igual (precio, nombre, bajada) pero
            el CTA queda no accionable con el aviso correspondiente. */}
        <div className="flex flex-col gap-1 border-b border-ink-100 pb-4">
          <h2 className="font-display text-xl text-ink-950">Productos</h2>
          {activo === undefined ? (
            <p className="text-sm text-ink-500">
              Es necesario tener un plan contratado para acceder a estos servicios.
            </p>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ON_DEMAND.map((producto: Producto) => {
            const yaLoTiene = contratados.some((p) => p.id === producto.id);
            const icono = iconoDeProducto(producto.id);
            const habilitado = activo !== undefined;
            return (
              <Card
                key={producto.id}
                as="article"
                className={
                  habilitado
                    ? 'flex flex-col gap-3'
                    : 'flex flex-col gap-3 !bg-ink-50 !ring-ink-200'
                }
              >
                {icono ? <CardHero icono={icono} deshabilitado={!habilitado} /> : null}
                <h3 className={habilitado ? 'text-lg font-medium text-ink-950' : 'text-lg font-medium text-ink-500'}>
                  {producto.nombre}
                </h3>
                <p
                  className={
                    habilitado
                      ? 'line-clamp-2 min-h-[2.5rem] text-sm text-ink-600'
                      : 'line-clamp-2 min-h-[2.5rem] text-sm text-ink-500'
                  }
                >
                  {producto.detalle}
                </p>
                <div className={habilitado ? 'flex flex-wrap items-center gap-2' : 'flex flex-wrap items-center gap-2 text-ink-500'}>
                  <Money
                    monto={producto.precio}
                    periodo="por mes"
                    {...(habilitado ? {} : { className: '!text-ink-500' })}
                  />
                </div>
                <div className="mt-auto pt-1">
                  {yaLoTiene ? (
                    <Chip tono="ok" icono={Check}>
                      Ya contratado
                    </Chip>
                  ) : (
                    <Button
                      variante="secundario"
                      ancho="full"
                      disabled={!habilitado}
                      onClick={
                        habilitado
                          ? () => {
                              if (sesion.emailPago) {
                                void elegir('producto', producto.id, sesion.emailPago);
                              } else {
                                setPendiente({ tipo: 'producto', id: producto.id });
                              }
                            }
                          : undefined
                      }
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

      {pendiente ? (
        <DialogoEmailMercadoPago
          onCerrar={() => setPendiente(null)}
          onConfirmar={(email) => {
            void elegir(pendiente.tipo, pendiente.id, email);
            setPendiente(null);
          }}
        />
      ) : null}
    </div>
  );
}
