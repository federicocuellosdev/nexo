// Importación SOLO de tipos: se borra al compilar, así que `lib/` sigue siendo
// una hoja y no arrastra `mock/` al bundle de nadie.
import type { Session } from '@/mock/session';

/**
 * Los cuatro estados del spec §5. Se derivan de la sesión en vez de guardarse
 * como campo: un campo `estado` se desincroniza en cuanto alguien agrega una
 * orden y se olvida de actualizarlo.
 */
export type EstadoCuenta = 'sinCuenta' | 'conCuentaSinPago' | 'pagadoSinPerfil' | 'activo';

export function derivarEstado(sesion: Session): EstadoCuenta {
  if (sesion.usuario === undefined) return 'sinCuenta';

  const tienePago = sesion.ordenes.some((orden) => orden.estado === 'pagada');
  if (!tienePago) return 'conCuentaSinPago';

  if (sesion.perfil === undefined) return 'pagadoSinPerfil';

  return 'activo';
}

export function coberturaActiva(sesion: Session): boolean {
  return derivarEstado(sesion) === 'activo';
}
