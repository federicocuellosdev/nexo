import type { ReactNode } from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';

export interface ItemTab<T extends string> {
  valor: T;
  label: string;
}

export interface TabsProps<T extends string> {
  valor: T;
  onCambio: (valor: T) => void;
  items: ItemTab<T>[];
  /** Nombre accesible de la lista de pestañas. */
  etiqueta: string;
  children: ReactNode;
}

/**
 * `Tabs` es genérico sobre el tipo del valor (`'planes' | 'productos'`, por
 * ejemplo) para que un `TabPanel` con un `valor` mal tipeado falle en
 * `tsc --noEmit`, en vez de fallar en runtime porque ningún panel coincide con
 * la pestaña activa.
 */
export function Tabs<T extends string>({ valor, onCambio, items, etiqueta, children }: TabsProps<T>) {
  return (
    <RadixTabs.Root
      value={valor}
      // Radix tipa `onValueChange` como `(value: string) => void`: no conoce
      // nuestro `T`. Este es el ÚNICO borde donde se angosta de nuevo a `T`;
      // es seguro porque los únicos `value` que Radix puede reportar acá son
      // los que le pasamos nosotros mismos en `RadixTabs.Trigger` de abajo,
      // que ya son de tipo `T`.
      onValueChange={(nuevoValor) => onCambio(nuevoValor as T)}
    >
      <RadixTabs.List
        aria-label={etiqueta}
        className="mb-5 inline-flex gap-1 rounded-pill bg-ink-100 p-1"
      >
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.valor}
            value={item.valor}
            className={[
              'rounded-pill px-4 py-2 text-sm font-medium text-ink-600',
              'transition-colors duration-200 ease-out-quart',
              'data-[state=active]:bg-white data-[state=active]:text-ink-950 data-[state=active]:shadow-suave',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-500',
            ].join(' ')}
          >
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {children}
    </RadixTabs.Root>
  );
}

export function TabPanel<T extends string>({ valor, children }: { valor: T; children: ReactNode }) {
  return (
    <RadixTabs.Content value={valor} className="focus-visible:outline-none">
      {children}
    </RadixTabs.Content>
  );
}
