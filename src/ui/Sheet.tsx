import * as RadixDialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/cn';
import type { CapaModalProps } from '@/ui/Dialog';
import { EncabezadoModal } from '@/ui/EncabezadoModal';

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
          className={cn(
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
          )}
        >
          <EncabezadoModal titulo={titulo} descripcion={descripcion} />
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
