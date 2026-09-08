import type { ReactNode } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export interface CapaModalProps {
  abierto: boolean;
  onCambio: (abierto: boolean) => void;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
}

const CERRAR =
  'inline-flex size-8 shrink-0 items-center justify-center rounded-pill text-ink-500 ' +
  'transition-colors duration-200 hover:bg-ink-100 hover:text-ink-800 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-500';

/** Diálogo centrado. Para el popup de alta usá `Sheet`, que es responsive. */
export function Dialog({ abierto, onCambio, titulo, descripcion, children }: CapaModalProps) {
  return (
    <RadixDialog.Root open={abierto} onOpenChange={onCambio}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-ink-950/40 transition-opacity duration-200 ease-out-quart starting:opacity-0" />
        <RadixDialog.Content
          className={[
            'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2',
            'max-h-[85dvh] overflow-y-auto rounded-card bg-white p-6 shadow-flotante',
            'transition-[opacity,transform] duration-250 ease-out-expo',
            'starting:opacity-0 motion-safe:starting:scale-95',
            'motion-reduce:transition-[opacity]',
          ].join(' ')}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <RadixDialog.Title className="font-display text-xl text-ink-950">{titulo}</RadixDialog.Title>
              {descripcion ? (
                <RadixDialog.Description className="mt-1 text-sm text-ink-600">
                  {descripcion}
                </RadixDialog.Description>
              ) : null}
            </div>
            <RadixDialog.Close aria-label="Cerrar" className={CERRAR}>
              <X size={18} aria-hidden="true" />
            </RadixDialog.Close>
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
