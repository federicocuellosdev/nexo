import type { LucideIcon } from 'lucide-react';

/** Tono semántico compartido por Badge, Chip e Icon. */
export type Tono = 'marca' | 'ok' | 'warn' | 'danger' | 'neutro';

/** Ítem de navegación: lo consumen BottomNav (mobile) y Sidebar (≥ lg). */
export type NavItem = {
  to: string;
  label: string;
  icono: LucideIcon;
  /**
   * Cuando `true`, el ítem se renderiza grisado y no es clickeable.
   * Se usa para pantallas que todavía no tienen contenido (ej. Movimientos
   * cuando el usuario no contrató nada) — así se preserva la jerarquía del
   * menú sin frustrar con pantallas vacías.
   */
  disabled?: boolean;
};
