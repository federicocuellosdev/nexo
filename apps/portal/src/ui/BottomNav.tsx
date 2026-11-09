import { NavLink } from 'react-router';
import { cn } from '@/lib/cn';
import type { NavItem } from '@/ui/tipos';

export interface BottomNavProps {
  items: NavItem[];
}

/**
 * Navegación inferior de mobile (390 px de referencia). `NavLink` pone
 * `aria-current="page"` solo, que es lo que pide el spec §7.
 *
 * Las etiquetas viajan como `sr-only` (no se pintan en pantalla pero siguen
 * en el árbol de accesibilidad) y el icono se agranda un punto para compensar.
 * En 360 px con 5 items entraba todo apretado con el label textual debajo; así
 * queda más aire y el footprint vertical baja a 56 px.
 */
export function BottomNav({ items }: BottomNavProps) {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto flex max-w-[560px]">
        {items.map((item) =>
          item.disabled ? (
            <li key={item.to} className="flex-1">
              <span
                role="link"
                aria-disabled="true"
                aria-label={item.label}
                className="flex h-14 cursor-not-allowed items-center justify-center text-ink-300"
              >
                <item.icono size={22} strokeWidth={1.75} aria-hidden="true" />
                <span className="sr-only">{item.label}</span>
              </span>
            </li>
          ) : (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                aria-label={item.label}
                className={({ isActive }) =>
                  cn(
                    'flex h-14 items-center justify-center',
                    'transition-colors duration-200 ease-out-quart',
                    isActive ? 'text-marca-600' : 'text-ink-500',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icono size={22} strokeWidth={isActive ? 2.25 : 1.75} aria-hidden="true" />
                    <span className="sr-only">{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
