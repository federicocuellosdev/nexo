/**
 * Datos de planes y servicios on demand portados de Nexo 2.0
 * (`docs/referencia/planes.nexo-2.0.ts`). Se portan SOLO los bloques `PLANES` y
 * `ON_DEMAND`, con los tipos redefinidos acá (spec §8). Todo lo demás del
 * archivo original era mecánica del 2.0 y no viaja.
 *
 * Este archivo se COPIA tal cual al repo `nexo-3.0-portal`: cualquier cambio
 * acá hay que replicarlo allá.
 */

/**
 * `no-incluido` es un estado EXPLÍCITO, no una ausencia. Nexo III no tiene
 * Emergencias ni Farmacia; si eso se comunica por omisión, el que compara tres
 * columnas termina creyendo que tiene ambulancia.
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

export type PlanSlug = 'nexo-1' | 'nexo-2' | 'nexo-3';

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

/**
 * Óptica. Fuente: `circuito_optica_previnca_v2.docx`. Cubre sin cargo armazón de
 * acetato y cristales minerales blancos de stock, hasta 4.00 dioptrías
 * esféricas y 2.00 cilíndricas.
 */
const OPTICA: Prestacion = {
  label: 'Óptica',
  estado: 'incluido',
  detalle: '1 par al año · Armazón y cristales de stock hasta 4.00 esf / 2.00 cil',
};

/** Coseguros de Doc24 según la aclaración de Javier Talarn. Pediatría no se lista: no se vende a menores. */
const PSICOLOGIA: Prestacion = {
  label: 'Doc24 · Psicología',
  estado: 'coseguro',
  detalle: '1 sesión a $15.000 · luego $30.000',
};

export const PLANES: Plan[] = [
  {
    slug: 'nexo-1',
    nombre: 'Nexo I',
    precio: 20000,
    bajada: 'La cobertura completa: emergencias, odontología y farmacia.',
    recomendado: true,
    prestaciones: [
      { label: 'Emergencias médicas', estado: 'incluido' },
      { label: 'Guardia odontológica', estado: 'incluido' },
      { label: 'Farmacia', estado: 'incluido' },
      // El documento de producto no lista Óptica en Nexo I pero sí en II y III,
      // que son más baratos. Probable omisión en el origen. A confirmar.
      { label: 'Óptica', estado: 'no-incluido', pendiente: true },
      { label: 'Doc24 · Clínica', estado: 'coseguro', detalle: '1 consulta sin cargo · luego $18.000' },
      PSICOLOGIA,
    ],
  },
  {
    slug: 'nexo-2',
    nombre: 'Nexo II',
    precio: 12000,
    bajada: 'Seguro de salud, farmacia y óptica, con telemedicina.',
    prestaciones: [
      { label: 'Seguro de Salud I', estado: 'incluido', detalle: 'Alta complejidad, internación y trasplante' },
      { label: 'Farmacia', estado: 'incluido' },
      OPTICA,
      { label: 'Médico a domicilio', estado: 'incluido', pendiente: true },
      { label: 'Doc24 · Clínica', estado: 'coseguro', detalle: '1 consulta sin cargo · luego $18.000' },
      PSICOLOGIA,
      { label: 'Emergencias médicas', estado: 'no-incluido' },
      { label: 'Guardia odontológica', estado: 'no-incluido' },
    ],
  },
  {
    slug: 'nexo-3',
    nombre: 'Nexo III',
    precio: 7000,
    bajada: 'La puerta de entrada: seguro de salud y telemedicina.',
    prestaciones: [
      {
        label: 'Seguro de Salud II',
        estado: 'incluido',
        detalle: 'Alta complejidad, enfermedades graves y rehabilitación',
      },
      OPTICA,
      { label: 'Doc24 · Clínica', estado: 'coseguro', detalle: 'Cobertura de $10.000 · luego $18.000' },
      PSICOLOGIA,
      { label: 'Emergencias médicas', estado: 'no-incluido' },
      { label: 'Guardia odontológica', estado: 'no-incluido' },
      { label: 'Farmacia', estado: 'no-incluido' },
    ],
  },
];

/** Servicios que se contratan y se pagan por fuera de la cuota. */
export const ON_DEMAND: Producto[] = [
  {
    id: 'salud-1',
    nombre: 'Seguro de Salud I',
    precio: 6000,
    detalle: 'Alta complejidad, internación y trasplante',
  },
  // Discrepancia sin resolver: el documento del cliente publica $5.000 y el
  // portal de Nexo 2.0 cobra $4.500. La define el cliente, no nosotros.
  {
    id: 'arbol-de-vida',
    nombre: 'Árbol de Vida',
    precio: 5000,
    detalle: 'Sepelio, cremación ecológica y parcela con árbol',
    pendiente: true,
  },
  {
    id: 'hogar-1',
    nombre: 'Seguro de Hogar · hasta 1er piso',
    precio: 19000,
    detalle: 'Casas, PB y 1er piso · Solo en Rosario',
  },
  {
    id: 'hogar-2',
    nombre: 'Seguro de Hogar · 2do piso +',
    precio: 22000,
    detalle: 'Dentro y fuera de Rosario',
  },
  // El precio venía con un comentario interno pegado: "chequear lista de precio
  // de vendedores me parece q esta mal". Sin confirmar.
  { id: 'vida', nombre: 'Seguro de Vida', precio: 2750, detalle: 'Suma asegurada $3.162.500', pendiente: true },
];

export function buscarPlan(slug: string): Plan | undefined {
  return PLANES.find((plan) => plan.slug === slug);
}

export function buscarProducto(id: string): Producto | undefined {
  return ON_DEMAND.find((producto) => producto.id === id);
}
