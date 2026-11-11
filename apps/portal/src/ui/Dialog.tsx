import type { ReactNode } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/cn';
import { EncabezadoModal } from '@/ui/EncabezadoModal';

export interface CapaModalProps {
  abierto: boolean;
  onCambio: (abierto: boolean) => void;
  titulo: string;
  descripcion?: string;
  /** Oculta visualmente el header (deja solo el botón cerrar). Para pantallas
   *  de éxito que muestran el título dentro del contenido centrado. */
  tituloOculto?: boolean;
  /** Ancho máximo del diálogo. `normal` = max-w-lg (default), `ancho` =
   *  max-w-4xl para listados tabulares (ej. historial de transacciones). */
  ancho?: 'normal' | 'ancho';
  children: ReactNode;
}

/** Diálogo centrado. Para el popup de alta usá `Sheet`, que es responsive. */
export function Dialog({ abierto, onCambio, titulo, descripcion, tituloOculto, ancho = 'normal', children }: CapaModalProps) {
  return (
    <RadixDialog.Root open={abierto} onOpenChange={onCambio}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-ink-950/40 transition-opacity duration-200 ease-out-quart starting:opacity-0" />
        <RadixDialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2',
            ancho === 'ancho' ? 'max-w-4xl' : 'max-w-lg',
            'max-h-[85dvh] overflow-y-auto rounded-card bg-white p-6 shadow-flotante',
            'transition-[opacity,transform] duration-250 ease-out-expo',
            'starting:opacity-0 motion-safe:starting:scale-95',
            'motion-reduce:transition-[opacity]',
          )}
        >
          <EncabezadoModal titulo={titulo} descripcion={descripcion} tituloOculto={tituloOculto} />
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
