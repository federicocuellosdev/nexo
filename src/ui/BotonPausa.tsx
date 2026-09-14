import { Pause, Play } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface BotonPausaProps {
  enPausa: boolean;
  onAlternar: () => void;
  /** Qué se pausa, para el nombre accesible: "el desplazamiento", "las fotos". */
  que: string;
  className?: string;
}

/**
 * Control para pausar algo que se mueve o cambia solo.
 *
 * NO es opcional ni decorativo: WCAG 2.2.2 (nivel A) exige un mecanismo para
 * pausar, detener u ocultar cualquier contenido que se mueva, parpadee o se
 * actualice solo por más de cinco segundos en paralelo con otro contenido.
 *
 * Pausar con `:hover` NO satisface el criterio: no existe para quien navega
 * con teclado. Por eso esto es un `<button>` de verdad, enfocable y con
 * `aria-pressed`.
 *
 * Vive en `ui/` porque lo usan la tira de fotos y el banner: dos controles
 * idénticos copiados serían dos lugares donde arreglar el mismo detalle.
 */
export function BotonPausa({ enPausa, onAlternar, que, className }: BotonPausaProps) {
  return (
    <button
      type="button"
      onClick={onAlternar}
      aria-pressed={enPausa}
      className={cn(
        'inline-flex size-10 items-center justify-center rounded-pill bg-ink-950/70 text-white backdrop-blur-sm',
        'transition-colors duration-200 ease-out-quart hover:bg-ink-950/90',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
        className,
      )}
    >
      {enPausa ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
      <span className="sr-only">{enPausa ? `Reanudar ${que}` : `Pausar ${que}`}</span>
    </button>
  );
}
