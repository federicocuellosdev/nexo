import type { ReactNode } from 'react';

export interface FieldProps {
  label: string;
  /** Debe coincidir con el `id` del control hijo. */
  htmlFor: string;
  error?: string;
  ayuda?: string;
  requerido?: boolean;
  /** Adorno a la derecha de la etiqueta (por ejemplo el Badge "opcional · a definir"). */
  extra?: ReactNode;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, ayuda, requerido = false, extra, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium text-ink-800">
          {label}
          {requerido ? (
            <span className="text-danger-500" aria-hidden="true">
              {' *'}
            </span>
          ) : null}
        </label>
        {extra}
      </div>
      {children}
      {ayuda && !error ? <p className="text-xs text-ink-500">{ayuda}</p> : null}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs text-danger-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
