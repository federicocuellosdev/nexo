import { Link } from 'react-router';
import { ShieldCheck } from 'lucide-react';
import type { Plan } from '@/mock/planes';
import type { EstadoCuenta } from '@/lib/estado';
import { CoberturaEstado } from '@/features/cobertura/CoberturaEstado';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { Money } from '@/ui/Money';
import { clasesBoton } from '@/ui/Button';

export interface CoberturaCardProps {
  plan: Plan;
  estado: EstadoCuenta;
  /** Fecha ficticia ya formateada para mostrar. */
  proximoVencimiento: string;
}

/** Patrón MercadoPago: título + dato grande + acción secundaria. */
export function CoberturaCard({ plan, estado, proximoVencimiento }: CoberturaCardProps) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Icon icono={ShieldCheck} tono="marca" />
          <div className="min-w-0">
            <p className="text-sm text-ink-500">Tu cobertura</p>
            <h3 className="font-display text-xl text-ink-950">{plan.nombre}</h3>
          </div>
        </div>
        <CoberturaEstado estado={estado} />
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Money monto={plan.precio} periodo="por mes" tamano="lg" />
        <span className="text-sm text-ink-500">{`Vence el ${proximoVencimiento}`}</span>
      </div>

      {estado === 'pagadoSinPerfil' ? (
        <div className="rounded-campo bg-warn-50 p-3">
          <p className="text-sm text-warn-700">
            Falta un paso: completá tu perfil para que la cobertura quede activa.
          </p>
          <Link
            to="/perfil/completar"
            className={clasesBoton({ tamano: 'sm', ancho: 'full', className: 'mt-3' })}
          >
            Completar perfil
          </Link>
        </div>
      ) : estado === 'conCuentaSinPago' ? (
        // NO ES CÓDIGO MUERTO, aunque hoy no se alcance: los dos consumidores
        // de <CoberturaCard/> (Inicio.tsx, Coberturas.tsx) solo la montan
        // cuando `planContratado(sesion)` devuelve un plan, y ese helper
        // exige una orden PAGADA — mutuamente excluyente con conCuentaSinPago.
        // Ese hueco (elegir un plan y no pagarlo, sin ver ningún recordatorio)
        // se cerró en Inicio.tsx leyendo `sesion.intent` directamente, sin
        // pasar por acá. Esta rama queda para el día en que `plan` deje de
        // exigir pago (ej. mostrar el plan intentado ANTES de pagar) — no
        // borrar por "inalcanzable" sin resolver antes ese rediseño, y no
        // asumir que hoy está viva.
        <div className="rounded-campo bg-danger-50 p-3">
          <p className="text-sm text-danger-700">
            Todavía no registramos tu pago. La cobertura arranca cuando lo hagas.
          </p>
          <Link
            to="/pago"
            className={clasesBoton({ tamano: 'sm', ancho: 'full', className: 'mt-3' })}
          >
            Pagar mi plan
          </Link>
        </div>
      ) : (
        <Link
          to="/coberturas"
          className={clasesBoton({ variante: 'secundario', tamano: 'sm', ancho: 'full' })}
        >
          Ver mi cobertura
        </Link>
      )}
    </Card>
  );
}
