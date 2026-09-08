import type { ReactNode } from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';

export interface ItemTab {
  valor: string;
  label: string;
}

export interface TabsProps {
  valor: string;
  onCambio: (valor: string) => void;
  items: ItemTab[];
  /** Nombre accesible de la lista de pestañas. */
  etiqueta: string;
  children: ReactNode;
}

export function Tabs({ valor, onCambio, items, etiqueta, children }: TabsProps) {
  return (
    <RadixTabs.Root value={valor} onValueChange={onCambio}>
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

export function TabPanel({ valor, children }: { valor: string; children: ReactNode }) {
  return (
    <RadixTabs.Content value={valor} className="focus-visible:outline-none">
      {children}
    </RadixTabs.Content>
  );
}
