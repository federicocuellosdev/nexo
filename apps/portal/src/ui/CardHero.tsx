import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface CardHeroProps {
  icono: LucideIcon;
  className?: string;
  /** Variante neutra (gris) para cards de productos deshabilitados. */
  deshabilitado?: boolean;
}

/**
 * Banda superior de las cards de plan y producto: degradado sutil de marca
 * (marca-50 → acento-50) con el ícono de referencia centrado en marca-700.
 *
 * Rompe el `p-5` del `Card` con márgenes negativos para llegar al borde; los
 * tonos siguen `Icon` (`bg-marca-50`/`text-marca-700`) y el degradado se queda
 * en la tipografía/50s para no competir con el precio ni el CTA. El ícono es
 * decorativo: la card ya lo nombra con el `h3`, así que `aria-hidden`.
 */
export function CardHero({ icono: Glifo, className, deshabilitado = false }: CardHeroProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        '-mx-5 -mt-5 flex h-28 items-center justify-center rounded-t-card',
        // Deshabilitado: bg-ink-100 (más oscuro que el ink-50 del Card padre)
        // para que la banda se diferencie del cuerpo y no queden fundidas.
        // Activo: fondo marca muy tenue (marca-50) + ícono violeta
        // (marca-600) — queda claro y no compite con el precio ni el CTA.
        deshabilitado ? 'bg-ink-100 text-ink-400' : 'bg-marca-50 text-marca-600',
        className,
      )}
    >
      <Glifo size={44} strokeWidth={1.5} />
    </div>
  );
}
