import type { LucideIcon } from 'lucide-react';
import { ShieldPlus, Stethoscope, HeartPulse } from 'lucide-react';
import type { PlanSlug } from '@/mock/planes';

const ICONO: Record<PlanSlug, LucideIcon> = {
  'nexo-1': ShieldPlus,
  'nexo-2': Stethoscope,
  'nexo-3': HeartPulse,
};

export function iconoDePlan(slug: PlanSlug): LucideIcon {
  return ICONO[slug];
}
