import { cn } from '@/lib/cn';
import logo from '@/assets/logo.png';

export type VarianteLogo = 'marca' | 'blanca';

export interface LogoNexoProps {
  /** Alto en px. El ancho se deriva del aspect-ratio real del PNG para no deformar la máscara. */
  alto?: number;
  variante?: VarianteLogo;
  /**
   * Nombre accesible. Pasá `null` cuando el logo va DENTRO de un elemento que
   * ya tiene su propio nombre accesible (p. ej. el `<Link>` de `Marca`): dos
   * nombres para el mismo control confunden al lector de pantalla.
   */
  etiqueta?: string | null;
  className?: string;
}

/** Ancho ÷ alto real del PNG fuente: 722×240 px. */
const RATIO_LOGO = 722 / 240;

/**
 * Nombre accesible de la marca. Se exporta para que cualquier lugar que
 * necesite nombrar el link que envuelve al logo (`Marca` en PublicLayout,
 * sus tests) lea del mismo lugar en vez de repetir el literal a mano.
 */
export const ETIQUETA_MARCA = 'Nexo — Previnca Salud';

/**
 * El único asset que existe de la marca es `logo.png`, 100% blanco (pensado
 * para fondo oscuro). Sobre esta landing, de fondo claro, quedaba blanco
 * sobre blanco: invisible. En vez de pedir un export nuevo, se usa el PNG
 * como MÁSCARA CSS (`mask-image`): el navegador toma su canal alfa y lo
 * rellena con lo que se ponga en `background`. Misma técnica que resuelve
 * el mismo problema en el portal (`nexo-portal/.../LogoNexo.tsx`, otro
 * repositorio), reimplementada acá desde cero para este stack (export
 * nombrado, tokens Tailwind v4 de 3.0, aspect-ratio real del PNG).
 *
 * `variante="marca"` (default): gradiente de marca, para fondo claro (TopBar,
 * pie). `variante="blanca"`: blanco sólido, para foto oscura o superficie
 * `marca-600`/`marca-700`.
 */
export function LogoNexo({ alto = 20, variante = 'marca', etiqueta = ETIQUETA_MARCA, className }: LogoNexoProps) {
  // `null` explícito (no cualquier falsy) es la única señal de "el contenedor
  // ya me nombra": una `etiqueta=""` pasada por error sigue siendo un nombre
  // (vacío, pero un string), no debe caer en la rama decorativa en silencio.
  const esDecorativo = etiqueta === null;

  return (
    <span
      role={esDecorativo ? undefined : 'img'}
      aria-label={esDecorativo ? undefined : etiqueta}
      aria-hidden={esDecorativo ? true : undefined}
      className={cn('inline-block shrink-0', className)}
      style={{
        height: alto,
        width: Math.round(alto * RATIO_LOGO),
        maskImage: `url(${logo})`,
        WebkitMaskImage: `url(${logo})`,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        background:
          variante === 'blanca' ? '#ffffff' : 'linear-gradient(135deg, var(--color-marca-600) 0%, var(--color-marca-300) 100%)',
        // En `forced-colors` (alto contraste de Windows) el user-agent pisa
        // `background` y no queda nada visible debajo (esto es un `<span>`
        // enmascarado, no un `<img>` con su propio contenido). Sin esto el
        // link de marca podría quedar vacío en ese modo.
        forcedColorAdjust: 'none',
      }}
    />
  );
}
