import type { LucideIcon } from 'lucide-react';
import { BriefcaseMedical, House, Building2, HeartHandshake, TreeDeciduous } from 'lucide-react';

/**
 * Ícono por producto on demand.
 *
 * Vive acá y NO en `mock/planes.ts` a propósito: ese archivo lo compara byte a
 * byte el test de paridad del repo hermano (`nexo-3.0-portal`), así que
 * agregarle un campo `icono` rompería el portal. Y además el ícono es una
 * decisión de presentación, no un dato del producto.
 *
 * Criterio de elección: cada ícono representa LO QUE EL PRODUCTO CUBRE, no una
 * metáfora bonita. Un ícono que no se lee de inmediato es peor que ninguno,
 * porque suma ruido visual sin agregar significado.
 *
 * Sobre `arbol-de-vida`: es un servicio de sepelio (cremación ecológica y
 * parcela con árbol). El árbol es literal en el producto, no una metáfora
 * elegida por nosotros para no nombrar la muerte. Se descartaron cruz, urna y
 * cualquier símbolo religioso: el servicio no lo es, y el nombre que el cliente
 * eligió ya define el tono.
 */
const ICONO: Record<string, LucideIcon> = {
  // Alta complejidad, internación y trasplante.
  'salud-1': BriefcaseMedical,
  // Sepelio, cremación ecológica y parcela con árbol.
  'arbol-de-vida': TreeDeciduous,
  // Casas, PB y 1er piso.
  'hogar-1': House,
  // 2do piso en adelante: edificio, para distinguirlo del anterior de un vistazo.
  'hogar-2': Building2,
  // Seguro de vida: cubre a quienes quedan, no a quien lo contrata.
  vida: HeartHandshake,
};

/** Ícono del producto, o `undefined` si es uno nuevo sin ícono asignado. */
export function iconoDeProducto(id: string): LucideIcon | undefined {
  return ICONO[id];
}
