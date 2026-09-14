import type { Ref } from 'react';
import type { EstadoCuenta } from '@/lib/estado';
import { numeroDeFarmacia, urlDeVerificacion } from '@/lib/credencial';
import { CoberturaEstado } from '@/features/cobertura/CoberturaEstado';
import { CredencialQR } from '@/features/credencial/CredencialQR';
import { LogoNexo } from '@/ui/LogoNexo';

export interface DatosCredencial {
  /** Nombre y apellido, ya resueltos. */
  nombre: string;
  /** Nombre del plan: "Nexo I", "Nexo II", "Nexo III". */
  plan: string;
  numeroAfiliado: string;
  /** Fin de vigencia, YA formateada para mostrar. */
  vigenteHasta: string;
}

export interface CredencialCardProps {
  datos: DatosCredencial;
  estado: EstadoCuenta;
  /** Origen de la URL del QR. Se inyecta para que el componente no lea `window`. */
  origen: string;
  /** Nodo a capturar en la descarga. */
  ref?: Ref<HTMLDivElement>;
}

/**
 * La credencial del socio. UN componente, tres consumidores: el portal, la
 * verificación pública y la descarga en PNG.
 *
 * Eso último es deliberado y es el arreglo de un defecto del 2.0, donde
 * `/verificar` reimplementa el JSX de la tarjeta a mano: dos diseños que había
 * que mantener sincronizados a ojo, y que en la práctica se separan.
 *
 * CONTRASTE — la razón por la que esta tarjeta NO usa el degradado violeta→rosa
 * de la marca. Medido sobre blanco:
 *
 *     #8660ef (marca-500)   4.26:1   ya no llega a AA
 *     #ee5cd0 (acento-500)  2.97:1   falla claramente
 *     #5734bd (marca-700)   7.98:1   ✓
 *     #14121c (ink-950)    ~17:1     ✓
 *
 * De todas las superficies del producto ésta es la que MÁS necesita
 * legibilidad: un farmacéutico lee quince dígitos monoespaciados de la pantalla
 * de un celular, con el mostrador iluminado de frente, y los tipea. Ahí 2.97:1
 * no es un detalle de accesibilidad, es una transcripción equivocada contra la
 * cuenta de otra persona. El degradado va de ink-950 a marca-700, así que el
 * texto blanco nunca baja de 7.98:1 y la tarjeta sigue siendo Previnca sin
 * discusión: el problema del violeta→rosa siempre fue el extremo rosa.
 */
export function CredencialCard({ datos, estado, origen, ref }: CredencialCardProps) {
  const farmacia = numeroDeFarmacia(datos.numeroAfiliado);
  const url = urlDeVerificacion(origen, datos.numeroAfiliado);

  return (
    <div
      ref={ref}
      // 20px y no `rounded-card` (16px): la credencial no es una tarjeta de
      // contenido, es el único objeto del producto donde la metáfora de
      // "tarjeta" es literal. Un radio más generoso la separa de las demás
      // superficies sin necesidad de decorarla.
      className="relative overflow-hidden rounded-[20px] p-5 text-white shadow-elevada sm:p-6"
      style={{
        backgroundImage:
          'linear-gradient(135deg, var(--color-ink-950) 0%, var(--color-marca-700) 100%)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        {/* `etiqueta` explícita: acá el logo no está adentro de ningún link que
            ya lo nombre, así que sí tiene que anunciarse. */}
        <LogoNexo variante="blanca" alto={18} />
        <CoberturaEstado estado={estado} />
      </div>

      {/* Pastilla contorneada en vez de `Chip tono="marca"`: el chip de marca es
          una pastilla CLARA, y al lado del chip de estado —que también es
          claro— quedaban dos manchas blancas peleando. El contorno se lee como
          relieve sobre la tarjeta y deja el estado como único acento. */}
      <p className="mt-5 inline-flex rounded-pill border border-white/30 px-2.5 py-1 text-xs font-medium tracking-wide">
        {datos.plan}
      </p>

      <p className="mt-2 font-display text-2xl italic">{datos.nombre}</p>

      {/* `flex-wrap` + `min-w-fit` en la lista, y no `min-w-0`: medido a 320px
          de viewport, la tarjeta queda en 288px y el número de farmacia pedía
          168px dentro de una caja de 132. NO desbordaba a la vista —el
          `overflow-hidden` de la tarjeta lo tapaba— así que se recortaba EN
          SILENCIO y quedaban trece dígitos en vez de quince. Ese es exactamente
          el error que `numeroDeFarmacia` se cuida de no cometer al calcular, y
          reaparecía acá como problema de layout.
          Con `min-w-fit` la lista se niega a encogerse por debajo de su
          contenido, así que en vez de recortar empuja al QR a la línea de
          abajo. El umbral no está escrito a mano: sale de cuánto miden de
          verdad los números. */}
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <dl className="flex min-w-fit flex-col gap-3">
          <Dato etiqueta="N° de afiliado" valor={datos.numeroAfiliado} />
          {/* El bloque de farmacia sólo existe si hay número, igual que en el
              2.0: una etiqueta sobre un valor vacío se lee como dato faltante. */}
          {farmacia === undefined ? null : <Dato etiqueta="N° farmacia" valor={farmacia} />}
        </dl>

        {/* El QR envuelto en un enlace REAL, que el 2.0 no tiene. Quien ve la
            pantalla escanea; quien navega con teclado o lector activa el mismo
            destino. Un QR suelto es información que sólo existe para una parte
            de la gente. */}
        <a
          href={url}
          className="ml-auto shrink-0 rounded-[10px] bg-white p-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <CredencialQR url={url} lado={88} className="block" />
          <span className="sr-only">Verificar esta credencial</span>
        </a>
      </div>

      <p className="mt-5 border-t border-white/20 pt-4 text-xs text-white/75">
        {`Vigente hasta ${datos.vigenteHasta}`}
      </p>
    </div>
  );
}

interface DatoProps {
  etiqueta: string;
  valor: string;
}

/**
 * SIN FORMATO EN LA UI: el valor se pinta tal como viene, sin separadores, sin
 * relleno y sin `toUpperCase`. El formato es responsabilidad de quien genera el
 * número —hoy `lib/credencial.ts`, mañana la base— y un segundo formateo acá
 * sería el mismo error que el fallback duplicado del 2.0.
 *
 * El único tratamiento es tipográfico, y no es decorativo: monoespaciada para
 * que el 0 y la O no se confundan, y `0.1em` de separación para que quince
 * dígitos seguidos se puedan leer de a grupos en vez de perder el renglón.
 *
 * `text-white/75` en la etiqueta: 5.22:1 contra marca-700, el extremo más claro
 * del degradado. Al 70% ya baja de 4.5:1 — ése es el piso, no lo bajes.
 */
function Dato({ etiqueta, valor }: DatoProps) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.6875rem] tracking-wide text-white/75 uppercase">{etiqueta}</dt>
      <dd className="font-mono text-base tracking-[0.1em] tabular-nums">{valor}</dd>
    </div>
  );
}
