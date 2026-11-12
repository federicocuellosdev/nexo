import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Plus, Tag } from 'lucide-react';
import { cn } from '@/lib/cn';
import { supabase } from '@/lib/supabase';
import { obtenerEtiquetasAdmin } from '@/lib/api';

export interface SelectorEtiquetaProps {
  id: string;
  valor: string;
  onCambio: (v: string) => void;
  placeholder?: string;
}

/**
 * Combobox para elegir o crear una etiqueta de vendedor. Autocompleta sobre
 * las etiquetas ya registradas en v3.vendedores (GET /admin/etiquetas) para
 * normalizar entradas y evitar duplicados por tipeo ("PREVINCA" vs
 * "Previnca"). Si lo escrito no matchea ninguna existente, muestra una
 * opción "Crear etiqueta <X>" al final del listado.
 *
 * El estado controlado (`valor`) sigue siendo un `string` libre — el combobox
 * solo asiste a elegir lo que ya existe.
 */
export function SelectorEtiqueta({ id, valor, onCambio, placeholder = 'Ej. PREVINCA, Externos…' }: SelectorEtiquetaProps) {
  const [opciones, setOpciones] = useState<string[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [indiceResaltado, setIndiceResaltado] = useState(0);
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelado = false;
    void (async () => {
      try {
        if (!supabase) return;
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;
        const lista = await obtenerEtiquetasAdmin(token);
        if (!cancelado) setOpciones(lista);
      } catch (err) {
        console.warn('[SelectorEtiqueta] fetch etiquetas', err);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  // Cerrar al clickear fuera. Listener global que remueve el popover si el
  // click no cayó adentro del contenedor.
  useEffect(() => {
    if (!abierto) return;
    function cerrarSiFuera(ev: MouseEvent) {
      if (contenedor.current && !contenedor.current.contains(ev.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener('mousedown', cerrarSiFuera);
    return () => document.removeEventListener('mousedown', cerrarSiFuera);
  }, [abierto]);

  const filtradas = useMemo(() => {
    const q = valor.trim().toLowerCase();
    if (q.length === 0) return opciones;
    return opciones.filter((et) => et.toLowerCase().includes(q));
  }, [opciones, valor]);

  // La opción "Crear etiqueta" aparece solo cuando hay texto nuevo que no
  // matchea exacto a ninguna existente (case-insensitive).
  const textoCreable = valor.trim();
  const matcheaExistente = opciones.some((et) => et.toLowerCase() === textoCreable.toLowerCase());
  const mostrarCrear = textoCreable.length > 0 && !matcheaExistente;

  function elegir(etiqueta: string) {
    onCambio(etiqueta);
    setAbierto(false);
  }

  function manejarTeclado(ev: React.KeyboardEvent<HTMLInputElement>) {
    if (!abierto) {
      if (ev.key === 'ArrowDown' || ev.key === 'Enter') {
        setAbierto(true);
        ev.preventDefault();
      }
      return;
    }
    const totalFilas = filtradas.length + (mostrarCrear ? 1 : 0);
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      setIndiceResaltado((i) => Math.min(i + 1, totalFilas - 1));
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      setIndiceResaltado((i) => Math.max(i - 1, 0));
    } else if (ev.key === 'Enter') {
      ev.preventDefault();
      if (indiceResaltado < filtradas.length) {
        elegir(filtradas[indiceResaltado]!);
      } else if (mostrarCrear) {
        elegir(textoCreable);
      }
    } else if (ev.key === 'Escape') {
      setAbierto(false);
    }
  }

  return (
    <div ref={contenedor} className="relative">
      <div className="relative">
        <Tag
          size={14}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
        />
        <input
          id={id}
          type="text"
          value={valor}
          placeholder={placeholder}
          onChange={(e) => {
            onCambio(e.target.value);
            setAbierto(true);
            setIndiceResaltado(0);
          }}
          onFocus={() => setAbierto(true)}
          onKeyDown={manejarTeclado}
          role="combobox"
          aria-expanded={abierto}
          aria-autocomplete="list"
          className={cn(
            'h-11 w-full rounded-campo border border-ink-200 bg-white pl-9 pr-9 text-base text-ink-900',
            'placeholder:text-ink-400 transition-colors duration-200',
            'hover:border-ink-300 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-marca-500',
          )}
        />
        {/* Chevron a la derecha para dejar en claro que es un selector (no un
            text input común). Clickeable: toggle del popover, así quien no
            escribe nada igual puede abrirlo. */}
        <button
          type="button"
          tabIndex={-1}
          aria-label={abierto ? 'Cerrar opciones' : 'Abrir opciones'}
          onMouseDown={(ev) => {
            ev.preventDefault();
            setAbierto((v) => !v);
          }}
          className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-pill text-ink-500 hover:text-ink-800"
        >
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={cn('transition-transform duration-150', abierto && 'rotate-180')}
          />
        </button>
      </div>

      {abierto && (filtradas.length > 0 || mostrarCrear) ? (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-campo border border-ink-200 bg-white shadow-flotante">
          <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
            {filtradas.map((et, i) => (
              <li
                key={et}
                role="option"
                aria-selected={valor === et}
                onMouseEnter={() => setIndiceResaltado(i)}
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  elegir(et);
                }}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm',
                  i === indiceResaltado ? 'bg-marca-50 text-marca-800' : 'text-ink-800 hover:bg-ink-50',
                )}
              >
                <span className="truncate">{et}</span>
                {valor === et ? <Check size={14} aria-hidden="true" className="text-marca-700" /> : null}
              </li>
            ))}
            {mostrarCrear ? (
              <li
                role="option"
                aria-selected={false}
                onMouseEnter={() => setIndiceResaltado(filtradas.length)}
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  elegir(textoCreable);
                }}
                className={cn(
                  'flex cursor-pointer items-center gap-2 border-t border-ink-100 px-3 py-2 text-sm',
                  indiceResaltado === filtradas.length ? 'bg-marca-50 text-marca-800' : 'text-marca-700 hover:bg-ink-50',
                )}
              >
                <Plus size={14} aria-hidden="true" />
                <span>
                  Crear etiqueta <strong className="font-medium">"{textoCreable}"</strong>
                </span>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
