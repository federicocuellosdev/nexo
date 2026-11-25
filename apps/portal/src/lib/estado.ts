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

  // Una pagada ya devuelta (tiene su contrapartida `dev-${id}`) no cuenta
  // como pago vigente. Antes el estado seguía siendo 'activo' después de un
  // declientar (= backend sin lead) porque la pagada original quedaba en la
  // sesión junto con la devolución, y el `some()` la contaba igual.
  const idsDevueltos = new Set(
    sesion.ordenes
      .filter((o) => o.estado === 'devuelta' && o.id.startsWith('dev-'))
      .map((o) => o.id.slice('dev-'.length)),
  );
  const tienePago = sesion.ordenes.some(
    (orden) => orden.estado === 'pagada' && !idsDevueltos.has(orden.id),
  );
  if (!tienePago) return 'conCuentaSinPago';

  if (sesion.perfil === undefined) return 'pagadoSinPerfil';

  return 'activo';
}

export function coberturaActiva(sesion: Session): boolean {
  return derivarEstado(sesion) === 'activo';
}
