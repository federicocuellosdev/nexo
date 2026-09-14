import { useMemo } from 'react';
import encodeQR from '@paulmillr/qr';

export interface CredencialQRProps {
  /** Lo que codifica el QR. Acá siempre es la URL pública de verificación. */
  url: string;
  /** Lado del cuadrado, en px. */
  lado?: number;
  className?: string;
}

/**
 * Zona de silencio, en módulos. El estándar pide 4 y no es negociable: sin ese
 * margen muchos lectores no enganchan el patrón. Va DENTRO del SVG y no como
 * padding CSS, así el margen viaja con la imagen — sobrevive al recorte del PNG
 * descargado y a cualquiera que reutilice el componente en otro contenedor.
 */
const BORDE = 4;

/**
 * Corrección de errores. `medium` (15%) es el punto justo: tolera una huella o
 * un reflejo sobre la pantalla del socio, y no infla la versión del código
 * —más módulos = módulos más chicos = más difícil de leer al tamaño al que esto
 * se muestra de verdad, que son unos 80 px en la pantalla de un celular.
 */
const CORRECCION = 'medium';

/**
 * QR de la credencial.
 *
 * Se dibuja como UN `<path>` construido a mano desde la matriz, en vez de
 * inyectar el SVG que la librería sabe serializar. Dos razones concretas:
 *
 *   1. Sin `dangerouslySetInnerHTML`. El contenido no viene del usuario, así
 *      que hoy no hay superficie de inyección — pero tampoco hace falta abrir
 *      la puerta para ahorrarse quince líneas.
 *   2. `html-to-image` clona el DOM nodo por nodo para armar el PNG. Un `<path>`
 *      con `shape-rendering="crispEdges"` se rasteriza nítido a pixelRatio 3;
 *      un SVG serializado y metido como string es una fuente de sorpresas.
 */
export function CredencialQR({ url, lado = 80, className }: CredencialQRProps) {
  const { d, modulos } = useMemo(() => construirTrazo(url), [url]);

  return (
    <svg
      viewBox={`0 0 ${modulos} ${modulos}`}
      width={lado}
      height={lado}
      // El QR es la representación gráfica de un enlace que YA está en el DOM
      // como link (ver `CredencialCard`), así que para un lector de pantalla es
      // ruido duplicado. Decorativo, entonces: quien no puede escanearlo llega
      // al mismo lugar activando el enlace que lo envuelve.
      aria-hidden="true"
      shapeRendering="crispEdges"
      className={className}
    >
      {/* Fondo blanco explícito: el QR vive sobre una tarjeta oscura y un
          código sin fondo claro no lo lee ningún lector. */}
      <rect width={modulos} height={modulos} fill="#ffffff" />
      <path d={d} fill="#14121c" />
    </svg>
  );
}

/**
 * Matriz de módulos → un único trazo SVG.
 *
 * Cada módulo oscuro aporta un cuadrado de 1×1 en coordenadas de módulo, así
 * que el `viewBox` es la matriz entera y el escalado lo hace el navegador sin
 * acumular error de redondeo.
 */
function construirTrazo(url: string): { d: string; modulos: number } {
  const matriz = encodeQR(url, 'raw', { ecc: CORRECCION, border: BORDE });
  const partes: string[] = [];

  for (let fila = 0; fila < matriz.length; fila += 1) {
    const columnas = matriz[fila] ?? [];
    for (let columna = 0; columna < columnas.length; columna += 1) {
      if (columnas[columna] === true) partes.push(`M${columna} ${fila}h1v1h-1z`);
    }
  }

  return { d: partes.join(''), modulos: matriz.length };
}
