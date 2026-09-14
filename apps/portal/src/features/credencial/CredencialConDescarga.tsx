import { useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import type { EstadoCuenta } from '@/lib/estado';
import { CredencialCard, type DatosCredencial } from '@/features/credencial/CredencialCard';
import { Button } from '@/ui/Button';

export interface CredencialConDescargaProps {
  datos: DatosCredencial;
  estado: EstadoCuenta;
  origen: string;
}

/** Triplica la resolución: la credencial se mira ampliada y se manda por WhatsApp. */
const ESCALA = 3;

/**
 * La credencial más su botón de descarga.
 *
 * El botón vive ACÁ y no dentro de `CredencialCard`, y eso no es una preferencia
 * de organización: `toPng` captura el nodo tal como está en el DOM, así que un
 * botón adentro de la tarjeta terminaría dibujado dentro del PNG. La tarjeta se
 * mantiene como unidad puramente presentacional y el "template" de descarga es,
 * literalmente, lo mismo que se ve en pantalla.
 */
export function CredencialConDescarga({ datos, estado, origen }: CredencialConDescargaProps) {
  const nodo = useRef<HTMLDivElement>(null);
  const [generando, setGenerando] = useState(false);
  const [fallo, setFallo] = useState(false);

  async function descargar() {
    if (nodo.current === null) return;

    setGenerando(true);
    setFallo(false);
    try {
      const dataUrl = await toPng(nodo.current, { pixelRatio: ESCALA });
      const enlace = document.createElement('a');
      enlace.download = `credencial-${datos.numeroAfiliado}.png`;
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

  return (
    // Ancho acotado: una credencial es un objeto físico con proporción de
    // tarjeta, no una banda. A ancho completo de contenido los números se
    // apelotonaban a la izquierda y el QR quedaba náufrago en un vacío de
    // doscientos píxeles. El botón hereda el mismo ancho, así que la unidad
    // "tarjeta + acción" se lee como una sola pieza.
    <div className="flex w-full max-w-[420px] flex-col gap-3">
      <CredencialCard ref={nodo} datos={datos} estado={estado} origen={origen} />

      {/* El ícono va como hijo: `Button` no tiene prop de ícono, ya trae
          `gap-2` en su base y compone por children. */}
      <Button
        variante="secundario"
        ancho="full"
        disabled={generando}
        aria-busy={generando}
        onClick={() => void descargar()}
      >
        <Download size={16} aria-hidden="true" />
        {generando ? 'Generando…' : 'Descargar credencial'}
      </Button>

      {fallo ? (
        <p role="alert" className="text-sm text-danger-700">
          No pudimos generar la imagen. Probá de nuevo, o mostrá la credencial desde esta pantalla.
        </p>
      ) : null}
    </div>
  );
}
