import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  CalendarClock,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { buscarPlan, buscarProducto } from '@/mock/planes';
import { agregarOrden, setSession, useSession, type TipoItem } from '@/mock/session';
import { consultarEstadoSuscripcion, crearSuscripcion } from '@/lib/api';
import { formatearPrecio } from '@/lib/formato';
import { DialogoEmailMercadoPago } from '@/features/pago/DialogoEmailMercadoPago';
import { Card } from '@/ui/Card';
import { Money } from '@/ui/Money';
import { Button, clasesBoton } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';

interface ItemAPagar {
  tipo: TipoItem;
  id: string;
  nombre: string;
  bajada?: string;
  precioUnitario: number;
  monto: number;
}

// Después de abrir el checkout de MP en una pestaña nueva pasamos a `esperando`
// y hacemos polling: cuando MP devuelve `authorized` saltamos a `confirmado`.
// Así, aunque el webhook demore o se pierda, la UI se entera igual.
type Estado =
  | { kind: 'resumen' }
  | { kind: 'esperando'; preapprovalId: string; emailMp: string; checkoutUrl: string }
  | { kind: 'confirmado'; emailMp: string };

const POLL_MS = 4000;

export function Pago() {
  const sesion = useSession();
  const intent = sesion.intent;
  const familiares = sesion.familiares ?? 0;
  const titulares = 1 + familiares;

  const plan = intent?.tipo === 'plan' ? buscarPlan(intent.id) : undefined;
  const producto = intent?.tipo === 'producto' ? buscarProducto(intent.id) : undefined;

  const item: ItemAPagar | undefined = plan
    ? {
        tipo: 'plan',
        id: plan.slug,
        nombre: plan.nombre,
        bajada: plan.bajada,
        precioUnitario: plan.precio,
        monto: plan.precio * titulares,
      }
    : producto
      ? {
          tipo: 'producto',
          id: producto.id,
          nombre: producto.nombre,
          bajada: producto.detalle,
          precioUnitario: producto.precio,
          monto: producto.precio,
        }
      : undefined;

  const [estado, setEstado] = useState<Estado>({ kind: 'resumen' });
  const [generandoSub, setGenerandoSub] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pidiendoEmail, setPidiendoEmail] = useState(false);

  // Polling mientras esperamos la confirmación. El backend consulta directo a
  // MP (no depende del webhook), así que esta función es la fuente de verdad
  // para saber cuándo transicionar a `confirmado`. Al detectar `authorized`
  // persistimos la orden en la sesión — eso dispara el cambio de estado a
  // `pagadoSinPerfil` y /inicio pasa a mostrar la tarjeta de cobertura con el
  // aviso de completar perfil.
  useEffect(() => {
    if (estado.kind !== 'esperando') return;
    if (item === undefined) return;
    let cancelado = false;
    const intervalo = setInterval(async () => {
      try {
        const status = await consultarEstadoSuscripcion(estado.preapprovalId);
        if (cancelado) return;
        if (status === 'authorized') {
          agregarOrden({
            // preapprovalId como id: idempotente ante cualquier re-entrada del
            // polling, aunque el cleanup del effect ya debería prevenirlo.
            id: `ord-${estado.preapprovalId}`,
            fecha: new Date().toISOString().slice(0, 10),
            tipo: item.tipo,
            itemId: item.id,
            concepto: `${item.nombre} · cuota mensual`,
            monto: item.monto,
            estado: 'pagada',
          });
          setEstado({ kind: 'confirmado', emailMp: estado.emailMp });
        }
      } catch (err) {
        console.warn('[pago] polling falló', err);
      }
    }, POLL_MS);
    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, [estado, item]);

  if (item === undefined) {
    return (
      <div className="mx-auto max-w-[560px]">
        <h1 className="text-2xl text-ink-950">Confirmá tu pago</h1>
        <div className="mt-6">
          <EmptyState
            como="h2"
            icono={CreditCard}
            titulo="No hay nada para pagar"
            descripcion="Elegí un plan y volvé al checkout."
          >
            <Link to="/planes" className={clasesBoton({ variante: 'secundario' })}>
              Ver planes
            </Link>
          </EmptyState>
        </div>
      </div>
    );
  }

  async function irAlCheckout(emailMp: string) {
    if (item === undefined) return;
    setError(undefined);
    setGenerandoSub(true);
    try {
      const { preapprovalId, initPoint } = await crearSuscripcion({
        planId: item.id,
        planNombre: item.nombre,
        monto: item.monto,
        emailMp,
      });
      window.open(initPoint, '_blank', 'noopener,noreferrer');
      setEstado({ kind: 'esperando', preapprovalId, emailMp, checkoutUrl: initPoint });
    } catch (err) {
      console.error('[pago] no se pudo crear la suscripcion', err);
      setError('No pudimos conectar con Mercado Pago. Probá de nuevo en un momento.');
    } finally {
      setGenerandoSub(false);
    }
  }

  function clickPagar() {
    const emailMp = sesion.emailPago;
    if (emailMp) {
      void irAlCheckout(emailMp);
    } else {
      setPidiendoEmail(true);
    }
  }

  if (estado.kind === 'esperando') {
    return <EsperandoPago emailMp={estado.emailMp} checkoutUrl={estado.checkoutUrl} />;
  }

  if (estado.kind === 'confirmado') {
    return <PagoConfirmado emailMp={estado.emailMp} />;
  }

  const esPlan = item.tipo === 'plan';

  return (
    <div className="mx-auto max-w-[560px]">
      <h1 className="text-2xl text-ink-950">Confirmá tu pago</h1>
      <p className="mt-1 text-balance text-sm text-ink-600">
        Revisá los datos y pagá con Mercado Pago. Podés cancelar la suscripción cuando quieras.
      </p>

      {/* Card principal: cada bloque separado por línea tenue + padding
          generoso para que el resumen respire. Un solo bloque con la info
          completa para que el paso a MP sea confirmación, no descubrimiento. */}
      <Card className="mt-6 flex flex-col divide-y divide-ink-100 p-0">
        {/* Header */}
        <div className="px-6 py-5 lg:px-7 lg:py-6">
          <p className="text-xs uppercase tracking-wide text-ink-500">
            {esPlan ? 'Plan de salud' : 'Producto on demand'}
          </p>
          <h2 className="mt-1 font-display text-2xl text-ink-950">{item.nombre}</h2>
          {item.bajada ? <p className="mt-2 text-sm text-ink-600">{item.bajada}</p> : null}
        </div>

        {/* Chips informativos. En plan muestra las 3; en producto solo las
            dos aplicables (cobertura y ciclo) — sin personas porque los
            productos son individuales. */}
        <div className="flex flex-wrap gap-2 px-6 py-5 lg:px-7">
          {esPlan ? (
            <ChipDetalle
              icono={Users}
              etiqueta={titulares === 1 ? '1 persona' : `${titulares} personas`}
            />
          ) : null}
          <ChipDetalle icono={ShieldCheck} etiqueta="Cobertura inmediata" />
          <ChipDetalle icono={CalendarClock} etiqueta="Cuota mensual" />
        </div>

        {/* Desglose del total. Si hay más de una persona, se ve claro que
            el precio por persona es `precioUnitario` y el total multiplica. */}
        <div className="flex flex-col gap-2 px-6 py-5 lg:px-7 lg:py-6">
          {titulares > 1 ? (
            <div className="flex items-baseline justify-between gap-3 text-sm text-ink-600">
              <span>
                {formatearPrecio(item.precioUnitario)} × {titulares} personas
              </span>
              <span className="tabular-nums">{formatearPrecio(item.monto)}</span>
            </div>
          ) : null}
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium text-ink-900">Total por mes</span>
            <Money monto={item.monto} periodo="/mes" />
          </div>
        </div>

        {/* Medio de pago — solo cuando ya capturamos el email MP. Antes de
            eso el popup lo pide y después vuelve acá mostrándolo. */}
        {sesion.emailPago ? (
          <div className="flex items-center gap-3 px-6 py-5 lg:px-7">
            <img
              src={`${import.meta.env.BASE_URL}mercadopago.png`}
              alt=""
              aria-hidden="true"
              className="size-9 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink-900">Mercado Pago</p>
              <p className="truncate text-xs text-ink-600">{sesion.emailPago}</p>
            </div>
            <button
              type="button"
              onClick={() => setPidiendoEmail(true)}
              className="shrink-0 text-xs font-medium text-marca-600 underline underline-offset-2 hover:text-marca-700 cursor-pointer"
            >
              Cambiar
            </button>
          </div>
        ) : null}
      </Card>

      {error ? (
        <p role="alert" className="mt-4 rounded-card bg-danger-50 px-4 py-3 text-sm text-danger-700 ring-1 ring-danger-200">
          {error}
        </p>
      ) : null}

      <Button
        ancho="full"
        tamano="lg"
        className="mt-6"
        onClick={clickPagar}
        disabled={generandoSub}
      >
        {generandoSub ? (
          'Generando suscripción…'
        ) : (
          <>
            Pagar con Mercado Pago
            <ExternalLink size={18} aria-hidden="true" />
          </>
        )}
      </Button>

      <p className="mt-3 text-center text-xs text-ink-500">
        Se abre el checkout seguro de Mercado Pago en una pestaña nueva.
      </p>

      {pidiendoEmail ? (
        <DialogoEmailMercadoPago
          onCerrar={() => setPidiendoEmail(false)}
          onConfirmar={(email) => {
            setSession({ emailPago: email });
            setPidiendoEmail(false);
            void irAlCheckout(email);
          }}
        />
      ) : null}
    </div>
  );
}

interface ChipDetalleProps {
  icono: typeof Users;
  etiqueta: string;
}

/** Chip neutral para los atributos del plan/producto en el resumen de pago. */
function ChipDetalle({ icono: Icono, etiqueta }: ChipDetalleProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill bg-ink-50 px-3 py-1.5 text-xs font-medium text-ink-700 ring-1 ring-ink-200/60">
      <Icono size={14} className="text-marca-600" aria-hidden="true" />
      {etiqueta}
    </span>
  );
}

/**
 * Estado "esperando confirmación de MP". Mismo tratamiento editorial que
 * /revisa-tu-mail del landing: icono circular grande, título serif itálica y
 * bajada en text-lg — es un momento transaccional de espera.
 */
function EsperandoPago({ emailMp, checkoutUrl }: { emailMp: string; checkoutUrl: string }) {
  return (
    <div className="mx-auto max-w-[600px] px-4 py-20 text-center lg:px-8 lg:py-28">
      <div className="flex justify-center">
        <span className="inline-flex size-20 items-center justify-center rounded-pill bg-marca-50 text-marca-700">
          <Loader2 size={32} className="animate-spin" aria-hidden="true" />
        </span>
      </div>

      <h1 className="mt-8 font-display text-4xl text-ink-950 italic">Esperando tu pago</h1>
      <p className="mt-5 text-lg text-ink-600">
        Completá el pago en Mercado Pago con{' '}
        <span className="font-medium text-ink-900">{emailMp}</span>. Apenas se acredite te avisamos acá — no cierres esta ventana.
      </p>

      <p className="mt-10 text-sm text-ink-600">
        ¿Se cerró la pestaña de Mercado Pago?{' '}
        <a
          href={checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-marca-600 underline underline-offset-2 hover:text-marca-700"
        >
          Abrir de nuevo
        </a>
      </p>
    </div>
  );
}

/**
 * Estado "pago confirmado". Misma estructura editorial que `EsperandoPago`
 * para que la transición se sienta continua: cambia el icono (spinner → check)
 * y el texto, pero la composición es la misma.
 */
function PagoConfirmado({ emailMp }: { emailMp: string }) {
  return (
    <div className="mx-auto max-w-[600px] px-4 py-20 text-center lg:px-8 lg:py-28">
      <div className="flex justify-center">
        <span className="inline-flex size-20 items-center justify-center rounded-pill bg-ok-50 text-ok-700">
          <CheckCircle2 size={32} aria-hidden="true" />
        </span>
      </div>

      <h1 className="mt-8 font-display text-4xl text-ink-950 italic">Pago confirmado</h1>
      <p className="mt-5 text-lg text-ink-600">
        Recibimos tu pago con <span className="font-medium text-ink-900">{emailMp}</span>. Tu suscripción ya quedó activa.
      </p>

      <div className="mt-10">
        <Link to="/inicio" className={clasesBoton({ variante: 'primario', tamano: 'lg' })}>
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
