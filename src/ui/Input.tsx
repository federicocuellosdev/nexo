import { useContext, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { FieldContext } from '@/ui/Field';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  /** Para uso standalone (sin Field): marca aria-invalid sin depender del contexto. */
  invalido?: boolean;
}

export function Input({ id, invalido = false, className, ...resto }: InputProps) {
  const campo = useContext(FieldContext);
  const esInvalido = invalido || Boolean(campo?.invalido);

  return (
    <input
      id={id}
      aria-invalid={esInvalido ? true : undefined}
      aria-describedby={campo?.describedBy}
      aria-required={campo?.requerido ? true : undefined}
      className={cn(
        'h-11 w-full rounded-campo border bg-white px-3 text-base text-ink-900',
        'placeholder:text-ink-400 transition-colors duration-200 ease-out-quart',
        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-marca-500',
        esInvalido ? 'border-danger-500' : 'border-ink-200 hover:border-ink-300',
        className,
      )}
      {...resto}
    />
  );
}
