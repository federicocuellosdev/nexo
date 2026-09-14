import { anclaClausula, CLAUSULAS } from '@/mock/terminos';
import { Revelar } from '@/ui/Revelar';
import { EncabezadoSeccion } from '@/ui/EncabezadoSeccion';

/**
 * Términos y Condiciones.
 *
 * Superficie de LECTURA pura: acá no se persuade a nadie. Medida angosta
 * (720px ≈ 75 caracteres por línea), cuerpo un punto más grande que el resto
 * del sitio y mucho interlineado. Sin reveals por scroll: quien viene a leer
 * un contrato no quiere que el texto aparezca de a poco.
 *
 * El índice existe porque son 17 cláusulas: sin él, encontrar "baja del
 * servicio" obliga a barrer la página entera. Cada cláusula tiene ancla propia
 * para poder enlazarla desde afuera (por ejemplo, desde el flujo de alta).
 */
export function Terminos() {
  return (
    <div className="mx-auto max-w-[760px] px-4 pt-16 pb-24 lg:px-8 lg:pt-24 lg:pb-32">
      <Revelar>
        <EncabezadoSeccion eyebrow="Lo que firmás" titulo="Términos y Condiciones" como="h1" />
        <p className="mt-6 text-base text-ink-600">
          Estos términos rigen la afiliación a NEXO y el uso de la plataforma de Previnca Salud.
        </p>
      </Revelar>

      {/* Índice. `<nav>` con lista: es navegación de verdad, no decoración. */}
      <nav aria-labelledby="indice-terminos" className="mt-12 rounded-card bg-white p-6 shadow-suave ring-1 ring-ink-100">
        <h2 id="indice-terminos" className="text-xs font-semibold tracking-[0.1em] text-ink-500 uppercase">
          Índice
        </h2>
        <ol className="mt-4 flex flex-col gap-2">
          {CLAUSULAS.map((clausula) => (
            <li key={clausula.numero}>
              <a
                href={`#${anclaClausula(clausula.numero)}`}
                className="text-sm text-ink-700 underline-offset-2 transition-colors duration-200 ease-out-quart hover:text-marca-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-500"
              >
                <span className="text-ink-400">{clausula.numero}.</span> {clausula.titulo}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-14 flex flex-col gap-12">
        {CLAUSULAS.map((clausula) => (
          <section key={clausula.numero} aria-labelledby={anclaClausula(clausula.numero)}>
            {/* `scroll-mt` para que el ancla no deje el título debajo del TopBar
                pegajoso: sin esto se salta a la cláusula y el encabezado queda
                tapado por la barra. */}
            <h2
              id={anclaClausula(clausula.numero)}
              className="scroll-mt-24 font-display text-2xl text-ink-950 lg:text-3xl"
            >
              <span className="text-marca-500">{`Cláusula ${clausula.numero}. `}</span>
              {clausula.titulo}
            </h2>

            <div className="mt-5 flex flex-col gap-4">
              {clausula.bloques.map((bloque, indice) =>
                bloque.tipo === 'parrafo' ? (
                  // Key por índice a propósito: los bloques son posicionales y
                  // dos párrafos podrían repetir texto.
                  <p key={indice} className="text-base leading-relaxed text-ink-700">
                    {bloque.texto}
                  </p>
                ) : (
                  <ol key={indice} className="flex flex-col gap-4 border-l-2 border-ink-100 pl-5">
                    {bloque.items.map((item, i) => (
                      <li key={i} className="text-base leading-relaxed text-ink-700">
                        {item.titulo ? (
                          <span className="font-semibold text-ink-950">{`${i + 1}. ${item.titulo}: `}</span>
                        ) : null}
                        {item.texto}
                      </li>
                    ))}
                  </ol>
                ),
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
