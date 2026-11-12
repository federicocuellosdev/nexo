import { useMemo } from 'react';
import encodeQR from '@paulmillr/qr';

export interface QRProps {
  url: string;
  lado?: number;
  className?: string;
}

/** Copia del QR del landing — mismo paquete + mismos parámetros. Vive
 *  acá para que el portal no dependa del código del landing. */
export function QR({ url, lado = 240, className }: QRProps) {
  const { d, modulos } = useMemo(() => construirTrazo(url), [url]);

  return (
    <svg
      viewBox={`0 0 ${modulos} ${modulos}`}
      width={lado}
      height={lado}
      aria-hidden="true"
      shapeRendering="crispEdges"
      className={className}
    >
      <rect width={modulos} height={modulos} fill="#ffffff" />
      <path d={d} fill="#14121c" />
    </svg>
  );
}

function construirTrazo(url: string): { d: string; modulos: number } {
  const matriz = encodeQR(url, 'raw', { ecc: 'medium', border: 4 });
  const partes: string[] = [];
  for (let fila = 0; fila < matriz.length; fila += 1) {
    const columnas = matriz[fila] ?? [];
    for (let columna = 0; columna < columnas.length; columna += 1) {
      if (columnas[columna] === true) partes.push(`M${columna} ${fila}h1v1h-1z`);
    }
  }
  return { d: partes.join(''), modulos: matriz.length };
}
