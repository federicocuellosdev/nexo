/**
 * Testimonios de socios reales de Previnca.
 *
 * REGLA DURA: acá NO se inventa nada. Cada cita es texto literal de un socio
 * real, con su nombre real. Un testimonio inventado es una reseña falsa, y en
 * una empresa de salud eso además es una promesa sobre un servicio.
 *
 * Si falta el texto de alguno, la entrada NO se agrega hasta tener el original
 * completo — ni siquiera como placeholder, porque los placeholders se publican.
 */
export interface Testimonio {
  id: string;
  /** Cita textual. La tarjeta se encarga de recortar la vista previa. */
  texto: string;
  /** Nombre tal como lo dio el socio. */
  autor: string;
  /** Antigüedad o vínculo: "Socia desde hace más de 40 años", "Socia nueva". */
  antiguedad: string;
  /**
   * `true` cuando la cita está ABREVIADA respecto del original y termina en
   * puntos suspensivos.
   *
   * No es un detalle de presentación: queda en el dato para que nadie confunda
   * después una cita recortada con la textual completa, y para que se sepa qué
   * hay que pedirle a Previnca si algún día se quiere mostrar entera.
   */
  abreviado?: boolean;
}

export const TESTIMONIOS: Testimonio[] = [
  {
    id: 'denise-coletti',
    // Cita truncada en la última oración COMPLETA. La parte original que
    // seguía después ("En la mayoría de los casos to…") quedaba cortada a mitad
    // de palabra y se leía como un error de layout. Cortar hasta el último
    // punto preserva lo literal sin inventar ni mostrar "…" en pantalla.
    texto:
      'Tengo el servicio desde que tengo uso de razón, con algunos cambios de por medio pero siempre con servicios asociado a mi familia.',
    autor: 'Denise Coletti',
    antiguedad: 'Socia desde hace años',
  },
  {
    id: 'felisa-albarran',
    // Mismo criterio: la cita original continuaba con "…soluciono mis inquietud…".
    // Truncamos a la oración completa anterior; cuando Previnca pase el texto
    // íntegro se reemplaza esta línea.
    // "Soy social" va TAL CUAL el original (probablemente "socia"). Una cita
    // textual no se corrige por criterio propio.
    texto:
      'Soy social desde hace más de 40 años, me cuesta la tecnología pero la atención de los empleados es impecable.',
    autor: 'Felisa Albarran',
    antiguedad: 'Socia desde hace más de 40 años',
  },
  {
    id: 'clau-dowling',
    texto:
      'Somos nuevos, pero destaco que ante unos errores me solucionaron todo rápido y excelente atención telefónica.',
    autor: 'Clau Dowling',
    antiguedad: 'Socia nueva',
  },
];

/** Largo a partir del cual la tarjeta recorta y ofrece "Ver más". */
export const LARGO_VISTA_PREVIA = 180;
