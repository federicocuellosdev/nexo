/**
 * Formateo de miles a mano. `toLocaleString` puede dar distinto en Node y en el
 * browser, y eso rompería tanto los tests como la coincidencia del render.
 */
export function formatearMiles(n: number): string {
  const entero = Math.trunc(Math.abs(n)).toString();
  const conPuntos = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return n < 0 ? `-${conPuntos}` : conPuntos;
}

export function formatearPrecio(n: number): string {
  return `$${formatearMiles(n)}`;
}

/**
 * Parte el monto para el patrón de `Money`: entero grande y decimales en
 * superíndice (spec §7).
 */
export function partesMoneda(n: number): { entero: string; decimales: string } {
  const centavos = Math.round(Math.abs(n) * 100);
  const entero = Math.trunc(centavos / 100);
  const decimales = (centavos % 100).toString().padStart(2, '0');
  return { entero: `${n < 0 ? '-' : ''}${formatearMiles(entero)}`, decimales };
}

/**
 * Precio de entrada ("desde $X/mes"). Se deriva de la lista en vez de
 * hardcodearse: en Nexo 2.0 quedó un precio viejo pegado en seis lugares del
 * sitio. Recibe la lista por parámetro para que `lib/` siga siendo una hoja y
 * no importe `mock/`.
 */
export function precioDesde(items: ReadonlyArray<{ precio: number }>): number {
  const primero = items[0];
  if (primero === undefined) throw new Error('precioDesde necesita al menos un ítem');
  return items.reduce((minimo, item) => (item.precio < minimo ? item.precio : minimo), primero.precio);
}
