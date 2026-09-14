import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { cn } from '@/lib/cn';
import type { NavItem } from '@/ui/tipos';

export interface SidebarProps {
  marca: ReactNode;
  items: NavItem[];
  /**
   * Quién está usando el portal. Va abajo de la navegación y arriba del pie.
   *
   * No es decoración de relleno: la columna quedaba con ~400px muertos entre la
   * nav y el pie, y en una herramienta que se usa a diario "de quién es esta
   * sesión" es dato de trabajo, no adorno. Es el mismo lugar donde lo ponen
   * Linear, Notion y Vercel.
   */
  identidad?: ReactNode;
  pie?: ReactNode;
}

/** Menú lateral de escritorio (≥ lg). Debajo de ese ancho manda `BottomNav`. */
export function Sidebar({ marca, items, identidad, pie }: SidebarProps) {
  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-ink-100 lg:bg-white lg:px-4 lg:py-6">
      <div className="px-2 pb-8">{marca}</div>
      <nav aria-label="Navegación principal" className="flex-1">
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-campo px-3 py-2.5 text-sm font-medium',
                    'transition-colors duration-200 ease-out-quart',
                    isActive ? 'bg-marca-50 text-marca-700' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icono size={18} strokeWidth={isActive ? 2.25 : 1.75} aria-hidden="true" />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      {identidad ? <div className="mt-4">{identidad}</div> : null}
      {pie ? <div className="mt-4 border-t border-ink-100 pt-4">{pie}</div> : null}
    </aside>
  );
}
