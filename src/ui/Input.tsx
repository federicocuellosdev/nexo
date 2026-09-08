import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  invalido?: boolean;
}

export function Input({ id, invalido = false, className, ...resto }: InputProps) {
  return (
    <input
      id={id}
      aria-invalid={invalido ? true : undefined}
      aria-describedby={invalido ? `${id}-error` : undefined}
      className={cn(
        'h-11 w-full rounded-campo border bg-white px-3 text-base text-ink-900',
        'placeholder:text-ink-400 transition-colors duration-200 ease-out-quart',
        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-marca-500',
        invalido ? 'border-danger-500' : 'border-ink-200 hover:border-ink-300',
        className,
      )}
      {...resto}
    />
  );
}
