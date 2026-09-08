import { Link } from 'react-router';
import { CircleAlert } from 'lucide-react';
import { buscarPlan, buscarProducto } from '@/mock/planes';
import { PlanPrestaciones } from '@/features/planes/PlanPrestaciones';
import { useSession } from '@/mock/session';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { Money } from '@/ui/Money';
import { clasesBoton } from '@/ui/Button';

export function Bienvenida() {
  const sesion = useSession();
  // El guard RequiereIntent garantiza usuario e intent; el `??` es solo para el tipo.
  const nombre = sesion.usuario?.nombre ?? '';
  const intent = sesion.intent;

  const plan = intent?.tipo === 'plan' ? buscarPlan(intent.id) : undefined;
  const producto = intent?.tipo === 'producto' ? buscarProducto(intent.id) : undefined;

  // HARD RULE (spec §8): cualquier dato con `pendiente: true` se anuncia con un
  // chip "a confirmar" a nivel resumen, misma convención que `AltaDialog` en la
  // landing: en un plan alcanza con que UNA prestación esté pendiente, en un
  // producto es su propio flag.
  const planPendiente = plan?.prestaciones.some((p) => p.pendiente) ?? false;

  return (
    <div className="mx-auto max-w-[560px]">
      <h1 className="text-2xl text-ink-950">{`Hola, ${nombre}`}</h1>
      <p className="mt-2 text-sm text-ink-600">Esto es lo que estás por contratar.</p>

      {plan ? (
        <Card className="mt-6 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-xl text-ink-950">{plan.nombre}</h2>
            <Money monto={plan.precio} periodo="por mes" />
          </div>
          <p className="text-sm text-ink-600">{plan.bajada}</p>
          {planPendiente ? (
            <Chip tono="warn" icono={CircleAlert}>
              Prestaciones a confirmar
            </Chip>
          ) : null}
          <div className="border-t border-ink-100 pt-1">
            <PlanPrestaciones prestaciones={plan.prestaciones.filter((p) => p.estado !== 'no-incluido')} />
          </div>
        </Card>
      ) : null}

      {producto ? (
        <Card className="mt-6 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-xl text-ink-950">{producto.nombre}</h2>
            <Money monto={producto.precio} periodo="por mes" />
          </div>
          <p className="text-sm text-ink-600">{producto.detalle}</p>
          {producto.pendiente ? (
            <Chip tono="warn" icono={CircleAlert}>
              Precio a confirmar
            </Chip>
          ) : null}
          <p className="rounded-campo bg-marca-50 px-3 py-2 text-sm text-ink-700">
            Este servicio requiere un plan activo.
          </p>
        </Card>
      ) : null}

      <div className="mt-6 flex flex-col gap-3">
        <Link to="/pago" className={clasesBoton({ tamano: 'lg', ancho: 'full' })}>
          Pagar con Mercado Pago
        </Link>
        <Link to="/planes" className="text-center text-sm font-medium text-marca-600 hover:text-marca-700">
          Elegir otro plan
        </Link>
      </div>
    </div>
  );
}
