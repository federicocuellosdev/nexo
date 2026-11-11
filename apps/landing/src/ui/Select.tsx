import { useContext, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { FieldContext } from '@/ui/Field';

export interface OpcionSelect {
  value: string;
  label: string;
}

export interface SelectProps {
  id: string;
  opciones: OpcionSelect[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  /** Recibe el value elegido, NO un evento DOM. */
  onChange?: (value: string) => void;
  /** Marca aria-invalid sin depender del contexto de `Field`. */
  invalido?: boolean;
  disabled?: boolean;
  className?: string;
  /** Nombre del campo si se envía por form submit nativo. */
  name?: string;
  /** Solo cuando no hay `Field` que lo nombre. */
  'aria-label'?: string;
}

/**
 * Combobox custom con popover propio.
 *
 * Antes era un `<select>` nativo: resolvía teclado y mobile sin trabajo, pero
 * el popup lo pinta el navegador y no se estiliza (fondo azul del sistema
 * sobre la opción activa). Lo cambié a popover controlado para que la lista
 * siga el design system; el trade-off es que perdemos el sheet nativo de iOS.
 */
export function Select({
  id,
  opciones,
  value,
  defaultValue,
  placeholder,
  onChange,
  invalido = false,
  disabled = false,
  className,
  name,
  'aria-label': ariaLabel,
}: SelectProps) {
  const campo = useContext(FieldContext);
  const esInvalido = invalido || Boolean(campo?.invalido);

  const [valorInterno, setValorInterno] = useState(defaultValue ?? '');
  const valor = value ?? valorInterno;
  const seleccionado = opciones.find((o) => o.value === valor);

  const [abierto, setAbierto] = useState(false);
  const [focado, setFocado] = useState<number>(() => {
    const idx = opciones.findIndex((o) => o.value === valor);
    return idx >= 0 ? idx : 0;
  });

  const contenedorRef = useRef<HTMLDivElement>(null);
  const botonRef = useRef<HTMLButtonElement>(null);
  const listaId = useId();
  const opcionIdPrefijo = useId();

  useEffect(() => {
    if (!abierto) return;
    function manejarClickFuera(evento: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener('mousedown', manejarClickFuera);
    return () => document.removeEventListener('mousedown', manejarClickFuera);
  }, [abierto]);

  useEffect(() => {
    if (abierto) {
      const idx = opciones.findIndex((o) => o.value === valor);
      setFocado(idx >= 0 ? idx : 0);
    }
  }, [abierto, opciones, valor]);

  function elegir(nuevo: string) {
    if (value === undefined) setValorInterno(nuevo);
    onChange?.(nuevo);
    setAbierto(false);
    botonRef.current?.focus();
  }

  function manejarTecla(evento: KeyboardEvent<HTMLButtonElement>) {
    if (!abierto) {
      if (evento.key === 'Enter' || evento.key === ' ' || evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
        evento.preventDefault();
        setAbierto(true);
      }
      return;
    }
    if (evento.key === 'ArrowDown') {
      evento.preventDefault();
      setFocado((f) => Math.min(opciones.length - 1, f + 1));
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault();
      setFocado((f) => Math.max(0, f - 1));
    } else if (evento.key === 'Home') {
      evento.preventDefault();
      setFocado(0);
    } else if (evento.key === 'End') {
      evento.preventDefault();
      setFocado(opciones.length - 1);
    } else if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      const opt = opciones[focado];
      if (opt) elegir(opt.value);
    } else if (evento.key === 'Escape') {
      evento.preventDefault();
      setAbierto(false);
    } else if (evento.key === 'Tab') {
      setAbierto(false);
    }
  }

  return (
    <div ref={contenedorRef} className="relative">
      <button
        ref={botonRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={abierto ? listaId : undefined}
        aria-activedescendant={abierto ? `${opcionIdPrefijo}-${focado}` : undefined}
        aria-invalid={esInvalido ? true : undefined}
        aria-describedby={campo?.describedBy}
        aria-required={campo?.requerido ? true : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && setAbierto((a) => !a)}
        onKeyDown={manejarTecla}
        className={cn(
          'flex h-11 w-full items-center justify-between gap-2 rounded-campo border bg-white px-3 text-left text-base',
          'transition-colors duration-200 ease-out-quart',
          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-marca-500',
          esInvalido ? 'border-danger-500' : 'border-ink-200 hover:border-ink-300',
          seleccionado ? 'text-ink-900' : 'text-ink-500',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
          className,
        )}
      >
        <span className="truncate">{seleccionado?.label ?? placeholder ?? ''}</span>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className={cn('shrink-0 text-ink-500 transition-transform duration-200', abierto && 'rotate-180')}
        />
      </button>

      {abierto ? (
        <ul
          id={listaId}
          role="listbox"
          aria-labelledby={id}
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-campo border border-ink-200 bg-white py-1 shadow-elevada"
        >
          {opciones.map((opcion, idx) => {
            const esSeleccionada = opcion.value === valor;
            const esFocada = idx === focado;
            return (
              <li
                key={opcion.value}
                id={`${opcionIdPrefijo}-${idx}`}
                role="option"
                aria-selected={esSeleccionada}
                onMouseEnter={() => setFocado(idx)}
                // onMouseDown en vez de onClick: el blur del botón que dispara
                // onClick llega después y el popover ya se habría cerrado,
                // comiéndose la selección.
                onMouseDown={(evento) => {
                  evento.preventDefault();
                  elegir(opcion.value);
                }}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm',
                  esFocada ? 'bg-marca-50 text-marca-700' : 'text-ink-900',
                  esSeleccionada && !esFocada && 'font-medium',
                )}
              >
                <span className="truncate">{opcion.label}</span>
                {esSeleccionada ? <Check size={16} aria-hidden="true" className="text-marca-700" /> : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {name ? <input type="hidden" name={name} value={valor} /> : null}
    </div>
  );
}
