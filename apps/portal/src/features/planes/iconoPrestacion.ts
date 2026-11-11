import type { LucideIcon } from 'lucide-react';
import { Stethoscope, HeartHandshake, Siren, Smile, Pill, ShieldCheck } from 'lucide-react';

/**
 * Icono por prestación. El match es por label porque las prestaciones viven
 * en `mock/planes.ts` como plain data sin discriminator — mapear por label
 * mantiene todo el acoplamiento visual en este archivo (y se cae a un
 * ShieldCheck genérico si aparece un label no mapeado).
 */
const ICONO_POR_LABEL: Record<string, LucideIcon> = {
  'Médico Clínico': Stethoscope,
  Psicología: HeartHandshake,
  'Emergencias médicas': Siren,
  'Guardia odontológica': Smile,
  'Descuentos en farmacias': Pill,
};

export function iconoDePrestacion(label: string): LucideIcon {
  return ICONO_POR_LABEL[label] ?? ShieldCheck;
}
