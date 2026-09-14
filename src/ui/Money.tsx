import { partesMoneda } from '@/lib/formato';
import { cn } from '@/lib/cn';

export interface MoneyProps {
  monto: number;
  /** Texto que acompaña al monto: "por mes", "único pago". */
  periodo?: string;
  tamano?: 'md' | 'lg';
  /**
   * `claro` para cuando el precio va sobre una foto o superficie oscura (la
   * portada de una ficha de plan). Existe como prop y no se resuelve con un
   * `className` porque el período lleva su propio color (`text-ink-500`), que
   * desde afuera sólo se podría pisar con un selector frágil al orden del DOM.
   */
  tono?: 'oscuro' | 'claro';
  className?: string;
}

/**
 * Patrón de precio de aplicación (spec §7): entero grande y centavos en
 * superíndice. Las partes visuales quedan ocultas al lector de pantalla y se
 * expone una sola frase legible, que si no se escucharía "veinte punto cero
 * cero cero cero cero".
 */
export function Money({ monto, periodo, tamano = 'md', tono = 'oscuro', className }: MoneyProps) {
  const { entero, decimales } = partesMoneda(monto);
  const accesible = `$${entero},${decimales}${periodo ? ` ${periodo}` : ''}`;
  const claro = tono === 'claro';

  return (
    <span
      className={cn(
        'inline-flex items-baseline font-semibold',
        claro ? 'text-white' : 'text-ink-950',
        tamano === 'lg' ? 'text-2xl' : 'text-xl',
        className,
      )}
    >
      <span aria-hidden="true" className="mr-0.5">
        $
      </span>
      <span aria-hidden="true">{entero}</span>
      <sup aria-hidden="true" className="ml-0.5 text-[0.5em] font-semibold">
        {decimales}
      </sup>
      {periodo ? (
        <span aria-hidden="true" className={cn('ml-1.5 text-sm font-normal', claro ? 'text-white/70' : 'text-ink-500')}>
          {periodo}
        </span>
      ) : null}
      <span className="sr-only">{accesible}</span>
    </span>
  );
}
