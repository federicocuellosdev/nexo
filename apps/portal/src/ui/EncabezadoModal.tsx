import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface EncabezadoModalProps {
  titulo: string;
  descripcion?: string;
  /** Oculta visualmente el título/descripción (solo lectores de pantalla). Para
   *  estados "éxito" que muestran el título dentro del contenido centrado. */
  tituloOculto?: boolean;
}

const CERRAR = cn(
  'inline-flex size-8 shrink-0 items-center justify-center rounded-pill text-ink-500',
  'transition-colors duration-200 hover:bg-ink-100 hover:text-ink-800',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-500',
);

/**
 * Título + descripción opcional + botón cerrar, compartidos por `Dialog` y
 * `Sheet`: antes vivían duplicados verbatim en ambos archivos.
 */
export function EncabezadoModal({ titulo, descripcion, tituloOculto }: EncabezadoModalProps) {
  if (tituloOculto) {
    return (
      <div className="flex justify-end">
        <RadixDialog.Title className="sr-only">{titulo}</RadixDialog.Title>
        {descripcion ? <RadixDialog.Description className="sr-only">{descripcion}</RadixDialog.Description> : null}
        <RadixDialog.Close aria-label="Cerrar" className={CERRAR}>
          <X size={18} aria-hidden="true" />
        </RadixDialog.Close>
      </div>
    );
  }
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <RadixDialog.Title className="font-display text-xl text-ink-950">{titulo}</RadixDialog.Title>
        {descripcion ? (
          <RadixDialog.Description className="mt-1 text-sm text-ink-600">{descripcion}</RadixDialog.Description>
        ) : null}
      </div>
      <RadixDialog.Close aria-label="Cerrar" className={CERRAR}>
        <X size={18} aria-hidden="true" />
      </RadixDialog.Close>
    </div>
  );
}
