/**
 * Copy comercial de los planes. Fuente: documento de producto del cliente
 * (capturas en `Nuevos servicios/`, 2026-09-01) + aclaración de Javier Talarn
 * en Slack sobre los coseguros de Doc24.
 *
 * Este archivo es SOLO copy de marketing. La matriz operativa de prestaciones
 * (cant. cubierta, valor cubierto, valor no cubierto) vive en Supabase y la
 * consume el portal: son dos cosas con distinta audiencia y distinta cadencia
 * de cambio. Ver el spec, sección "Por qué el copy y la matriz están separados".
 *
 * El único dato compartido con el portal es el PRECIO, y por eso lo verifica
 * `scripts/check-precios.mjs` contra `GET /api/planes`.
 */

/**
 * `no-incluido` es un estado EXPLÍCITO, no una ausencia. Nexo III no tiene
 * Emergencias ni Farmacia; si eso se comunica solo por omisión, el que compara
 * tres columnas no lo registra y termina creyendo que tiene ambulancia.
 */
export type Estado = 'incluido' | 'coseguro' | 'no-incluido';

export interface Prestacion {
  label: string;
  estado: Estado;
  /** Aclaración del coseguro: "1 consulta sin cargo · luego $18.000" */
  detalle?: string;
  /**
   * Dato que el cliente TODAVÍA NO CONFIRMÓ. Se pinta en rojo para que salte a la
   * vista en la revisión de staging. NO debe llegar a producción: antes de publicar
   * hay que confirmar el dato y sacar el flag, o borrar la línea.
   */
  pendiente?: boolean;
}

export interface PlanComercial {
  /** Identificador estable, igual al `slug` de la tabla `plans` del portal. */
  slug: 'nexo-1' | 'nexo-2' | 'nexo-3';
  nombre: string;
  precio: number;
  bajada: string;
  recomendado?: boolean;
  prestaciones: Prestacion[];
}

export interface ServicioOnDemand {
  id: string;
  nombre: string;
  precio: number;
  detalle: string;
  pendiente?: boolean;
}

/**
 * Formateo de miles a mano. `toLocaleString` puede dar distinto en Node (build SSG)
 * y en el browser, y eso rompe la coincidencia del render inicial al hidratar
 * (regla dura, AGENTS.md §6).
 */
export function formatearMiles(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Óptica. Fuente: `circuito_optica_previnca_v2.docx` (2026-09-01), que a su vez
 * cita TEXTUALMENTE la cartilla médica AGO 2026 de Previnca Salud para las
 * condiciones de cobertura. Prestador: Rosario Visión Ópticas (4 sucursales).
 *
 * Cubre sin cargo: armazón de acetato con alma de metal no ferrosa, cristales
 * minerales blancos de stock, hasta 4.00 dioptrías esféricas y 2.00 cilíndricas.
 * Lo que exceda ese alcance lo abona el afiliado a la óptica, con 20% de
 * descuento sobre el excedente.
 *
 * El resto del circuito (credencial + cuota al día + receta, sucursales, retiro)
 * es operativo: va en el portal del afiliado, no en el copy de la landing.
 *
 * Lo que el documento NO resuelve: en qué planes entra. Habla del "afiliado" de
 * Previnca Salud en general, sin mencionar Nexo I/II/III.
 *
 * Por eso los dos pendientes de Óptica tuvieron destinos distintos: en II y III
 * el flag estaba por las CONDICIONES DE COBERTURA que faltaban (el documento de
 * producto ya los listaba con Óptica, eso nunca estuvo en duda), y este
 * documento las trae, así que sale. En Nexo I el flag está por la ASIGNACIÓN
 * DE PLAN — el documento de producto no lo lista y este tampoco lo desmiente —,
 * así que sigue abierto.
 */
const OPTICA: Prestacion = {
  label: 'Óptica',
  estado: 'incluido',
  detalle: '1 par al año · Armazón y cristales de stock hasta 4.00 esf / 2.00 cil',
};

/**
 * Coseguros de Doc24 según la aclaración de Javier Talarn (Slack, 2026-08-31):
 * "en nexo ii que sale $12.000 tiene cubierta una consulta de clinica sin cargo,
 * y el resto a $18.000 (pediatria igual pero como no vendemos a menores no va a
 * aplicar). en nexo iii, tiene una cobertura a $10.000 y el resto a 18.000. Y
 * psicologia todo igual."
 *
 * Doc24 Pediatría NO se lista: no se vende a menores, así que ningún socio puede
 * usarla. Publicarla genera reclamos de posventa.
 */
const PSICOLOGIA: Prestacion = {
  label: 'Doc24 · Psicología',
  estado: 'coseguro',
  detalle: '1 sesión a $15.000 · luego $30.000',
};

export const PLANES: PlanComercial[] = [
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
      // El documento de producto no lista Óptica en Nexo I, pero sí en II y III,
      // que son más baratos. Probable omisión en el origen. A confirmar.
      // `circuito_optica_previnca_v2.docx` trajo QUÉ cubre la óptica, no EN QUÉ
      // PLANES entra, así que este pendiente sigue abierto.
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
      { label: 'Seguro de Salud II', estado: 'incluido', detalle: 'Alta complejidad, enfermedades graves y rehabilitación' },
      OPTICA,
      { label: 'Doc24 · Clínica', estado: 'coseguro', detalle: 'Cobertura de $10.000 · luego $18.000' },
      PSICOLOGIA,
      { label: 'Emergencias médicas', estado: 'no-incluido' },
      { label: 'Guardia odontológica', estado: 'no-incluido' },
      { label: 'Farmacia', estado: 'no-incluido' },
    ],
  },
];

/**
 * Servicios que se contratan y se pagan por fuera de la cuota.
 * Los dos Seguros de Hogar figuran con el mismo nombre en el documento de origen,
 * pero son los dos planes ya implementados en el portal (`hasta_1er_piso` y
 * `segundo_piso_plus`). Ver nexo-portal/docs/superpowers/specs/2026-06-30-seguro-hogar-design.md
 */
export const ON_DEMAND: ServicioOnDemand[] = [
  { id: 'salud-1', nombre: 'Seguro de Salud I', precio: 6000, detalle: 'Alta complejidad, internación y trasplante' },
  // DISCREPANCIA SIN RESOLVER: acá se publica $5.000 (documento de producto del
  // cliente) pero el portal COBRA $4.500 (nexo-portal ServiceCards.tsx, constante
  // ARBOL_VIDA_PRECIO). No se elige uno por nuestra cuenta: es el cliente quien
  // define cuál vale. `check-precios.mjs` no cubre esta discrepancia — solo
  // compara el bloque PLANES contra la tabla `plans`, y los servicios on demand
  // no viven ahí.
  { id: 'arbol-de-vida', nombre: 'Árbol de Vida', precio: 5000, detalle: 'Sepelio, cremación ecológica y parcela con árbol', pendiente: true },
  { id: 'hogar-1', nombre: 'Seguro de Hogar · hasta 1er piso', precio: 19000, detalle: 'Casas, PB y 1er piso · Solo en Rosario' },
  { id: 'hogar-2', nombre: 'Seguro de Hogar · 2do piso +', precio: 22000, detalle: 'Dentro y fuera de Rosario' },
  // El precio viene del documento con un comentario interno pegado: "chequear
  // lista de precio de vendedores me parece q esta mal". Sin confirmar.
  { id: 'vida', nombre: 'Seguro de Vida', precio: 2750, detalle: 'Suma asegurada $3.162.500', pendiente: true },
];

/**
 * Key de localStorage del plan elegido en una card, compartida entre `App.tsx`
 * (que escribe) y `Onboarding.tsx` (que lee). Este repo no corre `tsc`, así que
 * duplicar el literal en los dos archivos deja el mecanismo un typo lejos de
 * romperse en silencio, justo en la rama que existe para cerrar bugs de
 * sincronización de plan.
 *
 * Fuera del bloque `export const PLANES`/`ON_DEMAND` a propósito:
 * `scripts/check-precios.mjs` extrae precios con una regex acotada a ese rango.
 */
export const LS_PLAN_KEY = 'nexo_plan_slug';

/**
 * Precio de entrada ("desde $X/mes"): se deriva de PLANES en vez de
 * hardcodearse, para que no quede un número viejo pegado en la UI cuando
 * cambien las tarifas. Centralizado acá (y no repetido en cada componente que
 * lo usa — Hero, ComoFunciona, IPhoneCTA) porque esta misma entrega existe
 * para cerrar un $19.500 que había quedado hardcodeado en seis lugares del
 * sitio: repetir la derivación en vez de centralizarla reintroduciría la
 * misma clase de problema.
 */
export const PRECIO_DESDE = Math.min(...PLANES.map((p) => p.precio));
