import type { LucideIcon } from 'lucide-react';

/** Tono semántico compartido por Badge, Chip e Icon. */
export type Tono = 'marca' | 'ok' | 'warn' | 'danger' | 'neutro';

/** Ítem de navegación: lo consumen BottomNav (mobile) y Sidebar (≥ lg). */
export type NavItem = {
  to: string;
  label: string;
  icono: LucideIcon;
};
