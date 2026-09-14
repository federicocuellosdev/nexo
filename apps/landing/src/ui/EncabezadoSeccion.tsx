import { cn } from '@/lib/cn';

export type TamanoEncabezado = 'grande' | 'medio';

export interface EncabezadoSeccionProps {
  /** Va entre paréntesis, en serif itálica chica. Omitirlo deja sólo el título. */
  eyebrow?: string;
  titulo: string;
  /** `h1` para el título de una pantalla, `h2` para una sección dentro de ella. */
  como?: 'h1' | 'h2';
  tamano?: TamanoEncabezado;
  className?: string;
}

const TAMANOS: Record<TamanoEncabezado, string> = {
  // Portada de sección o título de pantalla.
  grande: 'text-4xl lg:text-5xl',
  // Sub-sección dentro de una pantalla ("Qué incluye", "Comparado con...").
  medio: 'text-2xl lg:text-3xl',
};

/**
 * Eyebrow itálico entre paréntesis + título en DM Serif Display itálica.
 *
 * Es el ladrillo que separa el lenguaje editorial del de aplicación: el mismo
 * texto a 40px se lee como el encabezado de un panel, y a 72px como una
 * portada. Vive acá y no dentro de una página porque lo usan las 6 pantallas
 * públicas; tenerlo copiado en cada una era la vía rápida a que divergieran.
 */
export function EncabezadoSeccion({
  eyebrow,
  titulo,
  como: Titulo = 'h2',
  tamano = 'grande',
  className,
}: EncabezadoSeccionProps) {
  return (
    <div className={className}>
      {eyebrow ? <p className="font-display text-lg text-marca-500 italic lg:text-xl">({eyebrow})</p> : null}
      <Titulo className={cn('max-w-[18ch] font-display text-ink-950 italic', eyebrow && 'mt-3', TAMANOS[tamano])}>
        {titulo}
      </Titulo>
    </div>
  );
}
