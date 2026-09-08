import { CircleAlert, CircleCheck, Clock } from 'lucide-react';
import type { EstadoCuenta } from '@/lib/estado';
import { Chip } from '@/ui/Chip';

export interface CoberturaEstadoProps {
  estado: EstadoCuenta;
}

/** Chip de estado de la cobertura. Sin cuenta no hay cobertura de la que hablar. */
export function CoberturaEstado({ estado }: CoberturaEstadoProps) {
  if (estado === 'sinCuenta') return null;

  if (estado === 'activo') {
    return (
      <Chip tono="ok" icono={CircleCheck}>
        Activa
      </Chip>
    );
  }

  if (estado === 'pagadoSinPerfil') {
    return (
      <Chip tono="warn" icono={Clock}>
        Pendiente de activación
      </Chip>
    );
  }

  return (
    <Chip tono="danger" icono={CircleAlert}>
      Sin pagar
    </Chip>
  );
}
