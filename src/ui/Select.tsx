import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface OpcionSelect {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  opciones: OpcionSelect[];
  placeholder?: string;
  invalido?: boolean;
}

/**
 * Select nativo. Radix Select no está en el stack acordado y el nativo trae
 * gratis el teclado, el scroll y la rueda del sistema operativo en mobile.
 */
export function Select({ id, opciones, placeholder, invalido = false, className, ...resto }: SelectProps) {
  return (
    <div className="relative">
      <select
        id={id}
        aria-invalid={invalido ? true : undefined}
        aria-describedby={invalido ? `${id}-error` : undefined}
        className={cn(
          'h-11 w-full appearance-none rounded-campo border bg-white pl-3 pr-10 text-base text-ink-900',
          'transition-colors duration-200 ease-out-quart',
          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-marca-500',
          invalido ? 'border-danger-500' : 'border-ink-200 hover:border-ink-300',
          className,
        )}
        {...resto}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {opciones.map((opcion) => (
          <option key={opcion.value} value={opcion.value}>
            {opcion.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={18}
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-500"
      />
    </div>
  );
}
