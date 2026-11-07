import type { LucideIcon } from 'lucide-react';
import { BriefcaseMedical, House, Building2, HeartHandshake, TreeDeciduous } from 'lucide-react';

/**
 * Vive acá y no en `mock/planes.ts` porque el test de paridad compara ese
 * archivo byte a byte con el de la landing: agregarle `icono` lo rompe. Y el
 * ícono es presentación, no dato del producto.
 */
const ICONO: Record<string, LucideIcon> = {
  'salud-1': BriefcaseMedical,
  'arbol-de-vida': TreeDeciduous,
  'hogar-1': House,
  'hogar-2': Building2,
  vida: HeartHandshake,
};

export function iconoDeProducto(id: string): LucideIcon | undefined {
  return ICONO[id];
}
