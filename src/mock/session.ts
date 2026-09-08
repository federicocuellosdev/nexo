import { useSyncExternalStore } from 'react';
import { PERFIL_DEMO, USUARIO_DEMO } from '@/mock/usuarios';

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
}

export type PresetDemo = 'nuevo-con-intent' | 'activo';

export const CLAVE_SESION = 'nexo3.session';

const VACIA: Session = { ordenes: [] };

function leerDeStorage(): Session {
  try {
    const crudo = localStorage.getItem(CLAVE_SESION);
    if (crudo === null) return VACIA;
    const parseado: unknown = JSON.parse(crudo);
    if (typeof parseado !== 'object' || parseado === null) return VACIA;
    const guardada = parseado as Partial<Session>;
    return {
      ...VACIA,
      ...guardada,
      // Normalizar: una sesión vieja o a medio escribir no tiene por qué dejar
      // `ordenes` undefined y hacer explotar cada `.map` del portal.
      ordenes: Array.isArray(guardada.ordenes) ? guardada.ordenes : [],
    };
  } catch {
    return VACIA;
  }
}

function escribirEnStorage(sesion: Session): void {
  try {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
  } catch {
    // Storage bloqueado (modo privado): la maqueta sigue andando en memoria.
  }
}

let estado: Session = leerDeStorage();
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

/** Aplica un parche superficial. El objeto se reemplaza entero para que `useSyncExternalStore` detecte el cambio por identidad. */
export function setSession(patch: Partial<Session>): void {
  estado = { ...estado, ...patch };
  escribirEnStorage(estado);
  emitir();
}

export function resetSession(): void {
  estado = VACIA;
  try {
    localStorage.removeItem(CLAVE_SESION);
  } catch {
    // Ver comentario de escribirEnStorage.
  }
  emitir();
}

export function agregarOrden(orden: Orden): void {
  estado = { ...estado, ordenes: [orden, ...estado.ordenes] };
  escribirEnStorage(estado);
  emitir();
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
  estado =
    preset === 'nuevo-con-intent'
      ? { usuario: USUARIO_DEMO, intent: { tipo: 'plan', id: 'nexo-2' }, ordenes: [] }
      : {
          usuario: USUARIO_DEMO,
          perfil: PERFIL_DEMO,
          intent: { tipo: 'plan', id: 'nexo-2' },
          ordenes: ORDENES_DEMO,
        };
  escribirEnStorage(estado);
  emitir();
}

export function useSession(): Session {
  return useSyncExternalStore(suscribir, getSession, getSession);
}
