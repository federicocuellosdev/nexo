import type { ReactNode } from 'react';

export interface BarraAccionFijaProps {
  children: ReactNode;
}

/**
 * Contenedor del CTA de contratar en las fichas de plan y producto: fijo al
 * pie en mobile (respeta el notch con `safe-area-inset-bottom`), estático
 * desde `lg`. Antes vivía duplicado verbatim en `FichaPlan` y `FichaProducto`.
 */
export function BarraAccionFija({ children }: BarraAccionFijaProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink-100 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:static lg:mt-10 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
      <div className="mx-auto max-w-[720px]">{children}</div>
    </div>
  );
}
