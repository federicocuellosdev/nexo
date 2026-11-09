import { useState } from 'react';
import { Link } from 'react-router';
import { CreditCard, ExternalLink } from 'lucide-react';
import { buscarPlan, buscarProducto } from '@/mock/planes';
import { setSession, useSession, type TipoItem } from '@/mock/session';
import { crearSuscripcion } from '@/lib/api';
import { DialogoEmailMercadoPago } from '@/features/pago/DialogoEmailMercadoPago';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { Money } from '@/ui/Money';
import { Button, clasesBoton } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';

interface ItemAPagar {
  tipo: TipoItem;
  id: string;
  concepto: string;
  nombre: string;
  monto: number;
}

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
        concepto: `${plan.nombre} · cuota mensual`,
        nombre: plan.nombre,
        monto: plan.precio * titulares,
      }
    : producto
      ? {
          tipo: 'producto',
          id: producto.id,
          concepto: `${producto.nombre} · cuota mensual`,
          nombre: producto.nombre,
          monto: producto.precio,
        }
      : undefined;

  const [generandoSub, setGenerandoSub] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pidiendoEmail, setPidiendoEmail] = useState(false);

  if (item === undefined) {
    return (
      <div className="mx-auto max-w-[560px]">
        <h1 className="text-2xl text-ink-950">Confirmá tu pago</h1>
        <div className="mt-6">
          <EmptyState
            // h2: cuelga del h1 "Confirmá tu pago", sin nivel intermedio.
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

  /**
   * Crea la suscripción contra /api/subscriptions y abre el checkout real
   * de Mercado Pago en una pestaña nueva. Si falla, muestra el error en
   * pantalla para que la persona pueda reintentar sin perder contexto.
   */
  async function irAlCheckout(emailMp: string) {
    if (item === undefined) return;
    setError(undefined);
    setGenerandoSub(true);
    try {
      const { initPoint } = await crearSuscripcion({
        planId: item.id,
        planNombre: item.nombre,
        monto: item.monto,
        emailMp,
      });
      window.open(initPoint, '_blank', 'noopener,noreferrer');
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

  return (
    <div className="mx-auto max-w-[560px]">
      <h1 className="text-2xl text-ink-950">Confirmá tu pago</h1>

      <Card className="mt-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base text-ink-800">{item.concepto}</p>
            {titulares > 1 ? (
              <p className="mt-1 text-xs text-ink-500">
                {titulares} personas · familia completa
              </p>
            ) : null}
          </div>
          <Money monto={item.monto} />
        </div>

        {sesion.emailPago ? (
          <div className="flex items-center gap-3 border-t border-ink-100 pt-4">
            <Icon icono={CreditCard} tono="marca" tamano="sm" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink-900">Mercado Pago</p>
              <p className="truncate text-xs text-ink-500">{sesion.emailPago}</p>
            </div>
          </div>
        ) : null}
      </Card>

      {error ? (
        <p role="alert" className="mt-4 rounded-card bg-danger-50 px-4 py-3 text-sm text-danger-700">
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
