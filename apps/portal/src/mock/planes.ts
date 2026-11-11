/**
 * Catálogo comercial. Hoy producción vende un único plan ("Previnca Nexo" a
 * $15.000), así que PLANES tiene una sola entrada y ON_DEMAND queda vacío.
 * El shape (PlanSlug, Prestacion, Producto) queda abierto para sumar sin
 * tocar los consumidores: el día que se habilite un nuevo plan o producto
 * alcanza con agregar la fila acá.
 *
 * Este archivo está DUPLICADO a propósito entre `apps/landing` y `apps/portal`
 * (spec §2). El test de paridad los compara byte a byte: cualquier cambio acá
 * hay que replicarlo en la otra app.
 */

/**
 * `no-incluido` es un estado EXPLÍCITO, no una ausencia. Si una prestación no
 * entra en el plan, el array la lista con `no-incluido` para que la UI pueda
 * distinguir "no cubierto" de "falta cargar el dato".
 */
export type EstadoPrestacion = 'incluido' | 'coseguro' | 'no-incluido';

export interface Prestacion {
  label: string;
  estado: EstadoPrestacion;
  /** Aclaración del coseguro: "1 consulta sin cargo · luego $18.000". */
  detalle?: string;
  /** Dato que Previnca todavía NO confirmó: se muestra con chip "a confirmar". */
  pendiente?: boolean;
}

/** Slug canónico del plan. Hoy solo vive `nexo-1`; si entra un plan nuevo,
 *  extender la unión. SF usa este slug para derivar el `offerCode`
 *  (XTEFO para nexo-1, único validado hoy). */
export type PlanSlug = 'nexo-1';

export interface Plan {
  slug: PlanSlug;
  nombre: string;
  precio: number;
  bajada: string;
  recomendado?: boolean;
  prestaciones: Prestacion[];
}

export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  detalle: string;
  pendiente?: boolean;
}

export const PLANES: Plan[] = [
  {
    slug: 'nexo-1',
    nombre: 'Previnca Nexo',
    precio: 15000,
    bajada: 'Cobertura completa: emergencias, odontología, farmacia y teleconsultas DOC24.',
    recomendado: true,
    prestaciones: [
      { label: 'Médico Clínico', estado: 'incluido', detalle: '1° Consulta sin cargo' },
      { label: 'Psicología', estado: 'incluido', detalle: '1° Sesión a $15.000' },
      {
        label: 'Emergencias médicas',
        estado: 'incluido',
        detalle: 'Asistencia inmediata ante situaciones de emergencia',
      },
      {
        label: 'Guardia odontológica',
        estado: 'incluido',
        detalle: 'Atención ante dolores agudos y urgencias',
      },
      { label: 'Descuentos en farmacias', estado: 'incluido', detalle: 'Hasta 50% off en farmacias adheridas' },
    ],
  },
];

/** Servicios que se contratan y pagan por fuera de la cuota. Hoy no hay
 *  ninguno publicado en producción: el catálogo solo expone el plan Previnca
 *  Nexo. El array queda definido para que los consumidores (PortalLayout,
 *  Inicio, Catalogo) no rompan al iterar sobre undefined. */
export const ON_DEMAND: Producto[] = [];

export function buscarPlan(slug: string): Plan | undefined {
  return PLANES.find((plan) => plan.slug === slug);
}

export function buscarProducto(id: string): Producto | undefined {
  return ON_DEMAND.find((producto) => producto.id === id);
}
