import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Check, ShieldCheck } from 'lucide-react';
import {
  buscarPlan,
  buscarProducto,
  ON_DEMAND,
  PLANES,
  type Plan,
  type PlanSlug,
  type Prestacion,
  type Producto,
} from '@/mock/planes';
import { PlanCard } from '@/features/planes/PlanCard';
import { ETIQUETA, GLIFO, TONO } from '@/features/planes/estadoPrestacion';
import { cn } from '@/lib/cn';
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
import { Button, clasesBoton } from '@/ui/Button';

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
        leadId: sesion.leadId,
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

      {/* Sin cobertura: grilla clásica de PlanCard (elegir plan es la tarea).
          Con cobertura + 'Subir de plan' tocado: tabla comparativa. */}
      {activo === undefined ? (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-xl text-ink-950">Planes</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {PLANES.map((plan: Plan) => (
              <PlanCard
                key={plan.slug}
                plan={plan}
                destacado={plan.recomendado === true}
                etiquetaCta="Contratar"
                onCta={(elegido) => {
                  if (sesion.emailPago) {
                    void elegir('plan', elegido.slug, sesion.emailPago);
                  } else {
                    setPendiente({ tipo: 'plan', id: elegido.slug });
                  }
                }}
              />
            ))}
          </div>
        </section>
      ) : mostrarPlanes ? (
        <PlanesComparativa
          activo={activo}
          onElegir={(plan) => {
            if (sesion.emailPago) {
              void elegir('plan', plan.slug, sesion.emailPago);
            } else {
              setPendiente({ tipo: 'plan', id: plan.slug });
            }
          }}
        />
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
              {/* 'Agregar persona' suma un adherente a la cobertura y manda
                  al wizard para completar sus datos. +1 a sesion.familiares
                  y navegar a /perfil/completar — el wizard crea un slot de
                  beneficiario por cada familiar y ya reconoce el nuevo. */}
              <button
                type="button"
                onClick={() => {
                  setSession({ familiares: (sesion.familiares ?? 0) + 1 });
                  void navegar('/perfil/completar');
                }}
                className={clasesBoton({ variante: 'secundario', ancho: 'full' })}
              >
                Agregar persona
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
                {/* Descripción con alto reservado para exactamente 2 líneas
                    (`text-sm` leading-5 × 2 = 2.5rem) + línea tenue abajo
                    que separa el bloque de precio. Así todas las cards
                    quedan con el mismo alto independiente del largo del
                    `detalle`. */}
                <p
                  className={
                    habilitado
                      ? 'line-clamp-2 min-h-[2.5rem] border-b border-ink-100 pb-3 text-sm text-ink-600'
                      : 'line-clamp-2 min-h-[2.5rem] border-b border-ink-100 pb-3 text-sm text-ink-500'
                  }
                >
                  {producto.detalle}
                </p>
                <div className={habilitado ? 'flex flex-wrap items-center gap-2' : 'flex flex-wrap items-center gap-2 text-ink-500'}>
                  <Money
                    monto={producto.precio}
                    periodo={producto.periodo ?? 'por mes'}
                    {...(habilitado ? {} : { className: '!text-ink-500' })}
                  />
                </div>
                <div className="mt-auto pt-1">
                  {yaLoTiene ? (
                    <Chip tono="ok" icono={Check}>
                      Ya contratado
                    </Chip>
                  ) : producto.proximamente ? (
                    <Button variante="secundario" ancho="full" disabled>
                      Próximamente
                    </Button>
                  ) : producto.href ? (
                    // Producto con URL externa (ej. Psicología → autogestión
                    // Doc24). Es navegación de verdad (puede abrirse en pestaña
                    // nueva), así que va como `<a>` con las clases del Button
                    // secundario — no como CTA de alta.
                    <a
                      href={producto.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-disabled={!habilitado ? true : undefined}
                      className={clasesBoton({ variante: 'secundario', ancho: 'full' })}
                    >
                      Ir al servicio
                    </a>
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

/**
 * Tabla comparativa de planes. Columnas = los 3 planes (con el actual
 * destacado); filas = la unión de todas las prestaciones. Cada celda
 * muestra el chip de estado + opcional detalle. El header de cada columna
 * trae el nombre del plan, el precio y el CTA ('Tu plan actual' o 'Subir
 * de plan').
 */
function PlanesComparativa({
  activo,
  onElegir,
}: {
  activo: Plan;
  onElegir: (plan: Plan) => void;
}) {
  // Unión ordenada de todas las prestaciones. Preserva el orden del primer
  // plan en que aparece cada label (que ya viene curado desde planes.ts).
  const todasLasPrestaciones: string[] = [];
  const porLabel = new Map<PlanSlug, Map<string, Prestacion>>();
  for (const plan of PLANES) {
    const porPlan = new Map<string, Prestacion>();
    for (const p of plan.prestaciones) {
      porPlan.set(p.label, p);
      if (!todasLasPrestaciones.includes(p.label)) todasLasPrestaciones.push(p.label);
    }
    porLabel.set(plan.slug, porPlan);
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-xl text-ink-950">Comparar planes</h2>
      <div className="overflow-x-auto rounded-card bg-white shadow-card ring-1 ring-ink-100">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-ink-100 align-top">
              <th scope="col" className="px-4 pb-4 pt-5 text-xs font-medium uppercase tracking-wide text-ink-500">
                Prestación
              </th>
              {PLANES.map((plan) => {
                const esElTuyo = plan.slug === activo.slug;
                return (
                  <th
                    key={plan.slug}
                    scope="col"
                    className={cn(
                      'min-w-[180px] px-4 pb-4 pt-5 align-top',
                      esElTuyo && 'bg-marca-50',
                    )}
                  >
                    <div className="flex flex-col items-start gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-base text-ink-950">{plan.nombre}</span>
                        {esElTuyo ? (
                          <span className="rounded-pill bg-marca-600 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                            Tu plan
                          </span>
                        ) : null}
                      </div>
                      <Money monto={plan.precio} periodo="/mes" />
                      {esElTuyo ? (
                        <span className="h-9 inline-flex items-center text-xs font-medium text-ink-500">
                          Plan actual
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onElegir(plan)}
                          className="inline-flex h-9 cursor-pointer items-center justify-center rounded-pill bg-brand-oscurecido px-4 text-sm font-medium text-white shadow-elevada transition-colors"
                        >
                          Subir de plan
                        </button>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {todasLasPrestaciones.map((label) => (
              <tr key={label} className="align-top">
                <td className="px-4 py-3 text-sm font-medium text-ink-900">{label}</td>
                {PLANES.map((plan) => {
                  const p = porLabel.get(plan.slug)?.get(label);
                  const esElTuyo = plan.slug === activo.slug;
                  const estado = p?.estado ?? 'no-incluido';
                  return (
                    <td
                      key={plan.slug}
                      className={cn('px-4 py-3', esElTuyo && 'bg-marca-50')}
                    >
                      <div className="flex flex-col gap-1">
                        <Chip tono={TONO[estado]} icono={GLIFO[estado]}>
                          {ETIQUETA[estado]}
                        </Chip>
                        {p?.detalle ? (
                          <span className="text-xs text-ink-500">{p.detalle}</span>
                        ) : null}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
