/**
 * Reglas del número de afiliado y del número de farmacia.
 *
 * EN NEXO 2.0 esto vive en un trigger de Postgres, y la base es la única fuente
 * de verdad: el `farmacia_number` que el 2.0 recalcula en TypeScript cuando la
 * columna viene vacía es lógica duplicada que se desincroniza.
 *
 * ACÁ NO HAY BASE (docs/CONTEXTO.md: "Maqueta clickeable... sin backend, BD,
 * auth ni pagos reales"). Así que estas funciones no duplican nada: son la
 * única fuente de verdad que existe hoy. Cuando Federico conecte Supabase, el
 * reemplazo correcto es la columna generada —no un segundo cálculo en TS— y
 * este módulo pasa a leer en vez de calcular.
 */

/** Identificador de Previnca en el sistema de farmacias. Fijo, no depende del plan. */
const PREFIJO_FARMACIA = '289';
/** Relleno final, fijo. */
const SUFIJO_FARMACIA = '0000';
/** Dígitos del tramo variable, con ceros a la izquierda. */
const DIGITOS_AFILIADO = 8;

/** 3 + 8 + 4. El sistema de farmacias no acepta otra longitud. */
export const LARGO_NUMERO_FARMACIA = 15;

/** Primer número de la serie. Heredado del 2.0, donde el correlativo arranca acá. */
export const PRIMER_NUMERO_AFILIADO = 1500;

/**
 * El número de afiliado es una cadena numérica pura: sin prefijo, sin relleno,
 * sin separadores. `"1500"`, no `"N-1500"` ni `"0000001500"`.
 *
 * Es el mismo predicado que el `~ '^[0-9]+$'` del trigger.
 */
export function esNumeroDeAfiliado(valor: string): boolean {
  return /^[0-9]+$/.test(valor);
}

/**
 * `1500` → `289000015000000`.
 *
 * El número de farmacia NO es un dato independiente: es una función pura del
 * número de afiliado. Nunca puede existir uno sin el otro, y por eso acá se
 * calcula al renderizar en vez de guardarse en la sesión — un campo guardado es
 * un campo que se puede desincronizar.
 *
 * DIFERENCIA DELIBERADA CON EL `lpad` DE POSTGRES: `lpad(x, 8, '0')` TRUNCA por
 * derecha si `x` tiene más de 8 dígitos, y devolvería un número de farmacia
 * silenciosamente equivocado apuntando a otro afiliado. Acá eso devuelve
 * `undefined`: preferimos no mostrar el bloque antes que mostrar 15 dígitos que
 * el farmacéutico va a tipear contra la cuenta de otra persona. (Con 8 dígitos
 * el tope son 99.999.999 afiliados, así que es una rama defensiva, no un caso
 * real — pero es exactamente la clase de rama que uno agradece tener.)
 */
export function numeroDeFarmacia(numeroAfiliado: string): string | undefined {
  if (!esNumeroDeAfiliado(numeroAfiliado)) return undefined;
  if (numeroAfiliado.length > DIGITOS_AFILIADO) return undefined;
  return PREFIJO_FARMACIA + numeroAfiliado.padStart(DIGITOS_AFILIADO, '0') + SUFIJO_FARMACIA;
}

/**
 * URL de verificación pública que codifica el QR.
 *
 * El origen se pasa por parámetro en vez de leer `window.location` adentro: así
 * la función es pura, testeable sin jsdom, y el día que la credencial se genere
 * del lado del servidor no hay que tocarla.
 */
export function urlDeVerificacion(origen: string, numeroAfiliado: string): string {
  return `${origen.replace(/\/$/, '')}/verificar/${numeroAfiliado}`;
}
