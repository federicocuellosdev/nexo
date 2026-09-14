import type { LucideIcon } from 'lucide-react';
import { Check, Minus, X } from 'lucide-react';
import type { EstadoPrestacion } from '@/mock/planes';
import type { Tono } from '@/ui/tipos';

/**
 * Mapas de estado de una prestación, compartidos por `PlanPrestaciones` (lista
 * dentro de la ficha de un plan) y `PlanComparador` (tabla entre planes): antes
 * vivían duplicados verbatim en ambos archivos.
 */
export const GLIFO: Record<EstadoPrestacion, LucideIcon> = {
  incluido: Check,
  coseguro: Minus,
  'no-incluido': X,
};

export const TONO: Record<EstadoPrestacion, Tono> = {
  incluido: 'ok',
  coseguro: 'warn',
  'no-incluido': 'neutro',
};

export const ETIQUETA: Record<EstadoPrestacion, string> = {
  incluido: 'Incluido',
  coseguro: 'Con coseguro',
  'no-incluido': 'No incluido',
};
