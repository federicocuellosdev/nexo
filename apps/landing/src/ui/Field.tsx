import { createContext, type ReactNode } from 'react';

export interface FieldContextValue {
  /** Id del párrafo de ayuda o de error que describe al control, si corresponde. */
  describedBy?: string;
  invalido: boolean;
  requerido: boolean;
}

// Contexto en vez de cloneElement: no le impone una forma al hijo (puede ser
// Input, Select o cualquier control futuro) y sigue funcionando si el control
// queda envuelto en otro nodo intermedio.
export const FieldContext = createContext<FieldContextValue | undefined>(undefined);

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
  const idAyuda = `${htmlFor}-ayuda`;
  const idError = `${htmlFor}-error`;
  const mostrarAyuda = Boolean(ayuda) && !error;
  const describedBy = error ? idError : mostrarAyuda ? idAyuda : undefined;

  const contexto: FieldContextValue = { describedBy, invalido: Boolean(error), requerido };

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
      <FieldContext.Provider value={contexto}>{children}</FieldContext.Provider>
      {mostrarAyuda ? (
        <p id={idAyuda} className="text-xs text-ink-500">
          {ayuda}
        </p>
      ) : null}
      {error ? (
        <p id={idError} role="alert" className="text-xs text-danger-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
