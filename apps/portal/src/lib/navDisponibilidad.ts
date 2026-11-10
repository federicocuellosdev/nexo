// Importación SOLO de tipos para no arrastrar `mock/` al bundle de nadie.
import type { Session } from '@/mock/session';
import { derivarEstado } from '@/lib/estado';

/**
 * Fuente única de verdad de qué rutas del portal están "activas" según el
 * estado de la sesión. Cualquier componente que renderice un link / card /
 * botón a una ruta tiene que pasarle su `to` a `rutaDeshabilitada` y usar
 * el valor para grisar (Sidebar, BottomNav, Accesos rápidos de Inicio, CTAs
 * sueltos tipo "Ver todos").
 *
 * Reglas:
 *   - `/inicio`, `/planes`, `/cuenta`: siempre habilitados.
 *   - `/coberturas` y `/familiares`: solo con cobertura ACTIVA. "Activa" =
 *     pagada + perfil completo (ver `derivarEstado`). Haber pagado solo no
 *     alcanza: Previnca no da la cobertura hasta que el perfil está cargado
 *     (documento, domicilio, obra social, contratación), así que grisarlo
 *     en estado `pagadoSinPerfil` evita prometer algo que todavía no está.
 *   - `/movimientos`: solo si hay al menos una orden cargada en la sesión
 *     — pagada, pendiente o devuelta. Sin historial no hay a dónde ir.
 */
export function sinCoberturaActiva(sesion: Session): boolean {
  return derivarEstado(sesion) !== 'activo';
}

export function rutaDeshabilitada(sesion: Session, to: string): boolean {
  const sinCobertura = sinCoberturaActiva(sesion);
  const tieneMovimientos = sesion.ordenes.length > 0;
  if (to === '/coberturas' || to === '/familiares') return sinCobertura;
  if (to === '/movimientos') return !tieneMovimientos;
  return false;
}
