// Importación SOLO de tipos para no arrastrar `mock/` al bundle de nadie.
import type { Session } from '@/mock/session';

/**
 * Fuente única de verdad de qué rutas del portal están "activas" según el
 * estado de la sesión. Cualquier componente que renderice un link / card /
 * botón a una ruta tiene que pasarle su `to` a `rutaDeshabilitada` y usar
 * el valor para grisar (Sidebar, BottomNav, Accesos rápidos de Inicio, CTAs
 * sueltos tipo "Ver todos").
 *
 * Reglas:
 *   - `/inicio` y `/planes`: siempre habilitados. Base + camino de
 *     contratación nueva. `/cuenta` idem.
 *   - `/coberturas` y `/familiares`: solo con plan vigente (al menos una
 *     orden de plan en estado `pagada`).
 *   - `/movimientos`: solo si hay al menos una orden cargada en la sesión
 *     — pagada, pendiente o devuelta. Sin historial no hay nada que mostrar.
 */
export function rutaDeshabilitada(sesion: Session, to: string): boolean {
  const tienePlanVigente = sesion.ordenes.some((o) => o.tipo === 'plan' && o.estado === 'pagada');
  const tieneMovimientos = sesion.ordenes.length > 0;
  if (to === '/coberturas' || to === '/familiares') return !tienePlanVigente;
  if (to === '/movimientos') return !tieneMovimientos;
  // /inicio, /planes, /cuenta y cualquier ruta no listada: habilitada por
  // default. Si aparece una nueva ruta con reglas, agregarla acá.
  return false;
}
