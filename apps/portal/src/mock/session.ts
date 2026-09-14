import { useSyncExternalStore } from 'react';
import { PERFIL_DEMO, USUARIO_DEMO } from '@/mock/usuarios';
import { derivarEstado } from '@/lib/estado';
import { PRIMER_NUMERO_AFILIADO } from '@/lib/credencial';

export interface Usuario {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
}

export interface Domicilio {
  calle: string;
  numero: string;
  piso?: string;
  localidad: string;
  provincia: string;
  cp: string;
}

export type TipoDocumento = 'DNI' | 'Pasaporte';
export type Sexo = 'F' | 'M' | 'X';
export type TipoContratacion = 'beneficiario' | 'tomador' | 'tomador-beneficiario';

/** Esquema de perfil validado por Previnca (ver docs/CONTEXTO.md). */
export interface PerfilPrevinca {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  sexo: Sexo;
  fechaNacimiento: string;
  domicilio: Domicilio;
  /** En debate: se pide, pero no bloquea el alta. */
  tieneObraSocial: boolean;
  obraSocial?: string;
  tipoContratacion: TipoContratacion;
}

export type TipoItem = 'plan' | 'producto';

/** Lo que el usuario venía a contratar cuando llegó desde la landing. */
export interface Intent {
  tipo: TipoItem;
  id: string;
}

export interface Orden {
  id: string;
  fecha: string;
  tipo: TipoItem;
  itemId: string;
  concepto: string;
  monto: number;
  estado: 'pagada' | 'pendiente';
}

export interface Session {
  usuario?: Usuario;
  perfil?: PerfilPrevinca;
  intent?: Intent;
  ordenes: Orden[];
  /**
   * N° de afiliado. Es el ÚNICO dato de la credencial que se guarda: todo lo
   * demás se deriva (el estado de `derivarEstado`, la vigencia de la última
   * orden pagada, el N° de farmacia del propio número). Se guarda porque un
   * correlativo global no se puede derivar del contenido de la sesión.
   *
   * Se asigna una sola vez, al pasar a `activo`, y NUNCA se regenera: es el
   * mismo contrato que la guarda `affiliate_number is null` del trigger del 2.0.
   */
  numeroAfiliado?: string;
}

export type PresetDemo = 'nuevo-con-intent' | 'activo';

export const CLAVE_SESION = 'nexo3.session';

// Fábrica en vez de constante compartida: cada llamada devuelve un objeto (y un
// array `ordenes`) nuevos, así ningún consumidor que mute un snapshot en el
// lugar (`.push`, `.sort`, etc.) puede corromper la base vacía para siempre.
function sesionVacia(): Session {
  return { ordenes: [] };
}

function leerDeStorage(): Session {
  try {
    const crudo = localStorage.getItem(CLAVE_SESION);
    if (crudo === null) return sesionVacia();
    const parseado: unknown = JSON.parse(crudo);
    if (typeof parseado !== 'object' || parseado === null) return sesionVacia();
    // Cast sin validar campo por campo: la maqueta confía en que el único
    // escritor de esta clave es `escribirEnStorage`, así que la validación
    // shallow (solo chequear `ordenes`) alcanza para este mock.
    const guardada = parseado as Partial<Session>;
    return {
      ...sesionVacia(),
      ...guardada,
      // Normalizar: una sesión vieja o a medio escribir no tiene por qué dejar
      // `ordenes` undefined y hacer explotar cada `.map` del portal.
      ordenes: Array.isArray(guardada.ordenes) ? guardada.ordenes : [],
    };
  } catch {
    return sesionVacia();
  }
}

function escribirEnStorage(sesion: Session): void {
  try {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
  } catch {
    // Storage bloqueado (modo privado): la maqueta sigue andando en memoria.
  }
}

/**
 * Contador del correlativo, en su PROPIA clave de storage.
 *
 * Vive fuera de la sesión a propósito: `resetSession()` borra la sesión pero no
 * el contador, así que recorrer el alta dos veces da 1500 y después 1501, que es
 * el comportamiento que hay que poder mostrar. Si viviera adentro, cada reset
 * devolvería 1500 y el correlativo no se vería nunca.
 *
 * LO QUE ESTE MOCK NO PUEDE HONRAR: el correlativo real es GLOBAL y único entre
 * todos los afiliados; éste es por navegador. Dos personas abriendo la maqueta
 * en paralelo sacan las dos el 1500. Eso no se arregla en el frontend — se
 * arregla cuando el número lo asigne la base, que es justo el punto donde el
 * 2.0 tiene el bug de concurrencia (`max()+1` sin lock) que hay que corregir.
 */
export const CLAVE_CONTADOR = 'nexo3.ultimoAfiliado';

function proximoNumeroDeAfiliado(): string {
  let ultimo = PRIMER_NUMERO_AFILIADO - 1;
  try {
    const crudo = localStorage.getItem(CLAVE_CONTADOR);
    const leido = crudo === null ? Number.NaN : Number.parseInt(crudo, 10);
    if (Number.isInteger(leido) && leido >= ultimo) ultimo = leido;
  } catch {
    // Storage bloqueado: se arranca de nuevo desde el primero.
  }

  const siguiente = ultimo + 1;
  try {
    localStorage.setItem(CLAVE_CONTADOR, String(siguiente));
  } catch {
    // Ídem. El número igual se devuelve; sin storage no hay serie que sostener.
  }
  return String(siguiente);
}

/**
 * Asigna el número si —y sólo si— la cuenta acaba de quedar activa y todavía no
 * tiene uno. Las dos guardas son las del trigger del 2.0, en el mismo orden:
 *
 *   1. `numeroAfiliado !== undefined` → NUNCA se regenera. Es lo que protege el
 *      número histórico de alguien que se da de baja y vuelve.
 *   2. `derivarEstado !== 'activo'` → nunca se asigna en pendiente. Ésta es la
 *      decisión de negocio importante del 2.0: asignar antes de que el pago
 *      esté confirmado quema números en gente que nunca paga.
 */
function conNumeroDeAfiliado(sesion: Session): Session {
  if (sesion.numeroAfiliado !== undefined) return sesion;
  if (derivarEstado(sesion) !== 'activo') return sesion;
  return { ...sesion, numeroAfiliado: proximoNumeroDeAfiliado() };
}

let estado: Session = leerDeStorage();

// Backfill: una sesión que ya venía activa de antes de que la credencial
// existiera no tiene número. Se le asigna al cargar, que es lo que haría una
// migración en la base real. Sin `emitir()`: todavía no hay suscriptores.
{
  const migrada = conNumeroDeAfiliado(estado);
  if (migrada !== estado) {
    estado = migrada;
    escribirEnStorage(estado);
  }
}

const oyentes = new Set<() => void>();

function emitir(): void {
  for (const oyente of oyentes) oyente();
}

function suscribir(oyente: () => void): () => void {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

export function getSession(): Session {
  return estado;
}

/**
 * Único camino de escritura del store (salvo `resetSession`, que borra).
 *
 * Existe para que la asignación del número NO dependa de que cada pantalla se
 * acuerde de pedirla. Las dos transiciones que activan una cuenta están en
 * archivos distintos —`Pago` agrega la orden, `PerfilCompletar` guarda el
 * perfil— y cuál de las dos completa la activación depende del camino que haya
 * hecho el usuario. Con la regla acá adentro, da igual: cualquier escritura que
 * deje la sesión activa asigna el número.
 */
function comprometer(siguiente: Session): void {
  estado = conNumeroDeAfiliado(siguiente);
  escribirEnStorage(estado);
  emitir();
}

/** Aplica un parche superficial. El objeto se reemplaza entero para que `useSyncExternalStore` detecte el cambio por identidad. */
export function setSession(patch: Partial<Session>): void {
  comprometer({ ...estado, ...patch });
}

export function resetSession(): void {
  estado = sesionVacia();
  try {
    localStorage.removeItem(CLAVE_SESION);
  } catch {
    // Ver comentario de escribirEnStorage.
  }
  emitir();
}

export function agregarOrden(orden: Orden): void {
  comprometer({ ...estado, ordenes: [orden, ...estado.ordenes] });
}

const ORDENES_DEMO: Orden[] = [
  {
    id: 'ord-1002',
    fecha: '2026-09-01',
    tipo: 'plan',
    itemId: 'nexo-2',
    concepto: 'Nexo II · cuota mensual',
    monto: 12000,
    estado: 'pagada',
  },
  {
    id: 'ord-1001',
    fecha: '2026-08-01',
    tipo: 'plan',
    itemId: 'nexo-2',
    concepto: 'Nexo II · cuota mensual',
    monto: 12000,
    estado: 'pagada',
  },
];

/** Atajos para la presentación: saltar a un estado sin recorrer todo el flujo. */
export function seedDemo(preset: PresetDemo): void {
  comprometer(
    preset === 'nuevo-con-intent'
      ? { usuario: USUARIO_DEMO, intent: { tipo: 'plan', id: 'nexo-2' }, ordenes: [] }
      : {
          usuario: USUARIO_DEMO,
          perfil: PERFIL_DEMO,
          intent: { tipo: 'plan', id: 'nexo-2' },
          ordenes: ORDENES_DEMO,
          // Número fijo y a mitad de la serie a propósito: si el preset saliera
          // del contador mostraría 1500, que se lee como marcador de posición.
          // 1547 se lee como un afiliado real.
          numeroAfiliado: '1547',
        },
  );
}

export function useSession(): Session {
  return useSyncExternalStore(suscribir, getSession, getSession);
}
