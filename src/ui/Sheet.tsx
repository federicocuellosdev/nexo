import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { CapaModalProps } from '@/ui/Dialog';

const CERRAR =
  'inline-flex size-8 shrink-0 items-center justify-center rounded-pill text-ink-500 ' +
  'transition-colors duration-200 hover:bg-ink-100 hover:text-ink-800 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-500';

/**
 * Hoja inferior en mobile, diálogo centrado desde `md`.
 * El desplazamiento de entrada vive detrás de `motion-safe:`: con
 * `prefers-reduced-motion` la hoja solo aparece con un fundido, sin recorrido.
 */
export function Sheet({ abierto, onCambio, titulo, descripcion, children }: CapaModalProps) {
  return (
    <RadixDialog.Root open={abierto} onOpenChange={onCambio}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-ink-950/40 transition-opacity duration-200 ease-out-quart starting:opacity-0" />
        <RadixDialog.Content
          className={[
            // Mobile (390 px): pegada abajo, ancho completo, respeta el notch.
            'fixed inset-x-0 bottom-0 z-50 max-h-[90dvh] overflow-y-auto',
            'rounded-t-card bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-flotante',
            'transition-[opacity,transform] duration-300 ease-out-expo',
            'starting:opacity-0 motion-safe:starting:translate-y-8',
            'motion-reduce:transition-[opacity]',
            // ≥ md: diálogo centrado.
            'md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:w-[calc(100%-3rem)] md:max-w-md',
            'md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-card md:p-6 md:pb-6',
            'md:motion-safe:starting:translate-y-[calc(-50%+0.5rem)]',
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
