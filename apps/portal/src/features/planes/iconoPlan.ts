import type { LucideIcon } from 'lucide-react';
import { ShieldPlus } from 'lucide-react';
import type { PlanSlug } from '@/mock/planes';

const ICONO: Record<PlanSlug, LucideIcon> = {
  'nexo-1': ShieldPlus,
};

export function iconoDePlan(slug: PlanSlug): LucideIcon {
  return ICONO[slug];
}
