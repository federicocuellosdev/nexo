import { buscarPlan, buscarProducto, type Plan, type Producto } from '@/mock/planes';
import type { Orden, Session } from '@/mock/session';

function pagadasDeTipo(sesion: Session, tipo: Orden['tipo']): Orden[] {
  return sesion.ordenes.filter((orden) => orden.estado === 'pagada' && orden.tipo === tipo);
}

/** La orden pagada más reciente, comparando por fecha ISO (ordenable como texto). */
function masReciente(ordenes: Orden[]): Orden | undefined {
  return ordenes.reduce<Orden | undefined>(
    (mejor, orden) => (mejor === undefined || orden.fecha > mejor.fecha ? orden : mejor),
    undefined,
  );
}

export function planContratado(sesion: Session): Plan | undefined {
  const ultima = masReciente(pagadasDeTipo(sesion, 'plan'));
  return ultima ? buscarPlan(ultima.itemId) : undefined;
}

export function productosContratados(sesion: Session): Producto[] {
  const ids = new Set(pagadasDeTipo(sesion, 'producto').map((orden) => orden.itemId));
  return [...ids].map((id) => buscarProducto(id)).filter((p): p is Producto => p !== undefined);
}

/** ISO `2026-09-01` → `01/09/2026`. A mano, sin `toLocaleDateString`, para que Node y el browser coincidan. */
export function formatearFecha(iso: string): string {
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}

/** Fecha ficticia de la próxima cuota: un mes después de la última pagada. */
export function proximoVencimiento(sesion: Session): string | undefined {
  const ultima = masReciente(pagadasDeTipo(sesion, 'plan'));
  if (ultima === undefined) return undefined;

  const fecha = new Date(`${ultima.fecha}T00:00:00Z`);
  fecha.setUTCMonth(fecha.getUTCMonth() + 1);

  const anio = fecha.getUTCFullYear().toString();
  const mes = (fecha.getUTCMonth() + 1).toString().padStart(2, '0');
  const dia = fecha.getUTCDate().toString().padStart(2, '0');
  return `${dia}/${mes}/${anio}`;
}
