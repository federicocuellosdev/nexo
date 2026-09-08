import { Link, useNavigate } from 'react-router';
import { CreditCard, Info } from 'lucide-react';
import { buscarPlan, buscarProducto } from '@/mock/planes';
import { agregarOrden, useSession, type Orden, type TipoItem } from '@/mock/session';
import { formatearPrecio } from '@/lib/formato';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { Money } from '@/ui/Money';
import { Button, clasesBoton } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';

interface ItemAPagar {
  tipo: TipoItem;
  id: string;
  concepto: string;
  monto: number;
}

function fechaDeHoy(): string {
  // Formato ISO corto y estable: sirve para ordenar y no depende del locale.
  return new Date().toISOString().slice(0, 10);
}

export function Pago() {
  const sesion = useSession();
  const navegar = useNavigate();
  const intent = sesion.intent;

  const plan = intent?.tipo === 'plan' ? buscarPlan(intent.id) : undefined;
  const producto = intent?.tipo === 'producto' ? buscarProducto(intent.id) : undefined;

  const item: ItemAPagar | undefined = plan
    ? { tipo: 'plan', id: plan.slug, concepto: `${plan.nombre} · cuota mensual`, monto: plan.precio }
    : producto
      ? { tipo: 'producto', id: producto.id, concepto: `${producto.nombre} · cuota mensual`, monto: producto.precio }
      : undefined;

  if (item === undefined) {
    return (
      <div className="mx-auto max-w-[560px]">
        <EmptyState
          icono={CreditCard}
          titulo="No hay nada para pagar"
          descripcion="Elegí un plan y volvé al checkout."
        >
          <Link to="/planes" className={clasesBoton({ variante: 'secundario' })}>
            Ver planes
          </Link>
        </EmptyState>
      </div>
    );
  }

  function pagar() {
    // Guard redundante: `item` ya está garantizado por el early return de arriba,
    // pero TS no propaga el narrowing de un const a través de un closure.
    if (item === undefined) return;
    const orden: Orden = {
      id: `ord-${Date.now()}`,
      fecha: fechaDeHoy(),
      tipo: item.tipo,
      itemId: item.id,
      concepto: item.concepto,
      monto: item.monto,
      estado: 'pagada',
    };
    agregarOrden(orden);
    void navegar('/pago/exito', { replace: true });
  }

  return (
    <div className="mx-auto max-w-[560px]">
      <h1 className="text-2xl text-ink-950">Confirmá tu pago</h1>

      <div className="mt-4 flex items-start gap-3 rounded-card bg-warn-50 p-4" role="note">
        <Icon icono={Info} tono="warn" tamano="sm" />
        <p className="text-sm font-medium text-warn-700">Simulación — acá irá Mercado Pago</p>
      </div>

      <Card className="mt-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <span className="text-base text-ink-800">{item.concepto}</span>
          <Money monto={item.monto} />
        </div>

        <div className="flex items-center gap-3 border-t border-ink-100 pt-4">
          <Icon icono={CreditCard} tono="neutro" tamano="sm" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-900">Visa •••• 4242</p>
            <p className="text-xs text-ink-500">Medio de pago de demostración</p>
          </div>
        </div>
      </Card>

      <Button ancho="full" tamano="lg" className="mt-6" onClick={pagar}>
        {`Pagar ${formatearPrecio(item.monto)}`}
      </Button>
    </div>
  );
}
