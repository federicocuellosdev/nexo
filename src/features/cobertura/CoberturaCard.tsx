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
            <p className="font-display text-xl text-ink-950">{plan.nombre}</p>
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
