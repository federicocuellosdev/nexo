import { useRef, useState, type RefObject } from 'react';
import { toPng } from 'html-to-image';

/** Triplica la resolución: la credencial se mira ampliada y se manda por WhatsApp. */
const ESCALA = 3;

export interface UseCredencialDownload {
  /** Ref a atar al nodo DOM de la credencial que se va a capturar. */
  ref: RefObject<HTMLDivElement | null>;
  /** Dispara la descarga del PNG. Nombre: `credencial-<nAfiliado>.png`. */
  descargar: () => Promise<void>;
  /** True mientras se genera el PNG. Útil para `disabled`/`aria-busy`. */
  generando: boolean;
  /** True si la última captura falló. Se resetea en cada `descargar()`. */
  fallo: boolean;
}

/**
 * Hook que aisla la lógica de descarga de la credencial (ref + state de
 * generación + error handling) para que el botón pueda vivir en cualquier
 * lugar del árbol — p.ej. al lado del "Ver mi cobertura" de /inicio, aunque
 * la tarjeta esté en otra columna.
 */
export function useCredencialDownload(numeroAfiliado: string): UseCredencialDownload {
  const ref = useRef<HTMLDivElement | null>(null);
  const [generando, setGenerando] = useState(false);
  const [fallo, setFallo] = useState(false);

  async function descargar() {
    if (ref.current === null) return;

    setGenerando(true);
    setFallo(false);
    try {
      const dataUrl = await toPng(ref.current, { pixelRatio: ESCALA });
      const enlace = document.createElement('a');
      enlace.download = `credencial-${numeroAfiliado}.png`;
      enlace.href = dataUrl;
      enlace.click();
    } catch {
      // Se avisa en vez de fallar en silencio: el botón vuelve a su estado
      // normal y quien lo apretó no sabría si pasó algo o si no llegó a tocar.
      setFallo(true);
    } finally {
      setGenerando(false);
    }
  }

  return { ref, descargar, generando, fallo };
}
