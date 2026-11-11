import { useMemo } from 'react';
import encodeQR from '@paulmillr/qr';

export interface QRProps {
  /** Lo que codifica el QR (URL). */
  url: string;
  /** Lado del cuadrado, en px. Por default 240px — tamaño cómodo para escanear
   *  en una pantalla de celular desde ~20 cm. */
  lado?: number;
  className?: string;
}

/**
 * Componente QR simple para el landing. Replicado del `CredencialQR` del
 * portal (mismo paquete + mismos parámetros) — vive separado porque ese
 * archivo es parte de la credencial del socio y no vale importarlo cross-app.
 *
 * Correción de errores 'medium' (15%): tolera reflejos y huellas sin inflar
 * la versión del código. Borde 4 módulos (estándar) para que los lectores
 * enganchen el patrón.
 */
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
