import { partesMoneda } from '@/lib/formato';
import { cn } from '@/lib/cn';

export interface MoneyProps {
  monto: number;
  /** Texto que acompaña al monto: "por mes", "único pago". */
  periodo?: string;
  tamano?: 'md' | 'lg';
  className?: string;
}

/**
 * Patrón de precio de aplicación (spec §7): entero grande y centavos en
 * superíndice. Las partes visuales quedan ocultas al lector de pantalla y se
 * expone una sola frase legible, que si no se escucharía "veinte punto cero
 * cero cero cero cero".
 */
export function Money({ monto, periodo, tamano = 'md', className }: MoneyProps) {
  const { entero, decimales } = partesMoneda(monto);
  const accesible = `$${entero},${decimales}${periodo ? ` ${periodo}` : ''}`;

  return (
    <span
      className={cn(
        'inline-flex items-baseline font-semibold text-ink-950',
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
        <span aria-hidden="true" className="ml-1.5 text-sm font-normal text-ink-500">
          {periodo}
        </span>
      ) : null}
      <span className="sr-only">{accesible}</span>
    </span>
  );
}
