import { NavLink } from 'react-router';
import { cn } from '@/lib/cn';
import type { NavItem } from '@/ui/tipos';

export interface BottomNavProps {
  items: NavItem[];
}

/**
 * Navegación inferior de mobile (390 px de referencia). `NavLink` pone
 * `aria-current="page"` solo, que es lo que pide el spec §7.
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
                className="flex h-16 cursor-not-allowed flex-col items-center justify-center gap-1 text-[11px] font-medium text-ink-300"
              >
                <item.icono size={20} strokeWidth={1.75} aria-hidden="true" />
                <span>{item.label}</span>
              </span>
            </li>
          ) : (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium',
                    'transition-colors duration-200 ease-out-quart',
                    isActive ? 'text-marca-600' : 'text-ink-500',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icono size={20} strokeWidth={isActive ? 2.25 : 1.75} aria-hidden="true" />
                    <span>{item.label}</span>
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
