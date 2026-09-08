import { cn } from '@/lib/cn';

export interface SkeletonProps {
  className?: string;
}

/**
 * Bloque de carga. El pulso queda anulado bajo `prefers-reduced-motion` por la
 * regla global de `global.css`.
 */
export function Skeleton({ className }: SkeletonProps) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-campo bg-ink-100', className)} />;
}
