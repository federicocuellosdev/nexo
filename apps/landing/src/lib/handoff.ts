import { portalUrl } from '@/lib/urls';

export interface DatosUsuarioAlta {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
}

export interface HandoffAlta {
  intent: 'alta';
  tipo: 'plan' | 'producto';
  id: string;
  usuario: DatosUsuarioAlta;
}

export interface HandoffLogin {
  intent: 'login';
  email: string;
}

export type Handoff = HandoffAlta | HandoffLogin;

/**
 * El intent vive en `sessionStorage` (no en `localStorage`) porque solo tiene
 * que sobrevivir el salto del popup a `/revisa-tu-mail`. El portal está en OTRO
 * origen, así que este storage nunca llega allá: el traspaso real va por la URL.
 */
export const CLAVE_HANDOFF = 'nexo3.alta';

export function construirUrlCallback(handoff: Handoff, base: string = portalUrl()): string {
  const parametros = new URLSearchParams();
  parametros.set('token', 'demo');
  parametros.set('intent', handoff.intent);

  if (handoff.intent === 'alta') {
    parametros.set('tipo', handoff.tipo);
    parametros.set('id', handoff.id);
    parametros.set('nombre', handoff.usuario.nombre);
    parametros.set('apellido', handoff.usuario.apellido);
    parametros.set('email', handoff.usuario.email);
    parametros.set('tel', handoff.usuario.telefono);
  } else {
    parametros.set('email', handoff.email);
  }

  return `${base.replace(/\/+$/, '')}/auth/callback?${parametros.toString()}`;
}

export function guardarHandoff(handoff: Handoff): void {
  try {
    sessionStorage.setItem(CLAVE_HANDOFF, JSON.stringify(handoff));
  } catch {
    // Storage bloqueado (modo privado de algunos navegadores): la maqueta sigue
    // funcionando, solo se pierde el resumen al recargar /revisa-tu-mail.
  }
}

export function leerHandoff(): Handoff | null {
  try {
    const crudo = sessionStorage.getItem(CLAVE_HANDOFF);
    if (crudo === null) return null;
    const parseado: unknown = JSON.parse(crudo);
    if (typeof parseado !== 'object' || parseado === null) return null;
    const intent = (parseado as { intent?: unknown }).intent;
    if (intent !== 'alta' && intent !== 'login') return null;
    return parseado as Handoff;
  } catch {
    return null;
  }
}

export function borrarHandoff(): void {
  try {
    sessionStorage.removeItem(CLAVE_HANDOFF);
  } catch {
    // Ver comentario de guardarHandoff.
  }
}
