export interface UsuarioCallback {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
}

export interface CallbackAlta {
  intent: 'alta';
  tipo: 'plan' | 'producto';
  id: string;
  usuario: UsuarioCallback;
}

export interface CallbackLogin {
  intent: 'login';
  email: string;
}

export type Callback = CallbackAlta | CallbackLogin;

const TOKEN_DEMO = 'demo';

/**
 * Parseo del enlace mágico. Devuelve `null` ante CUALQUIER inconsistencia en
 * vez de completar con valores por defecto: sembrar una sesión a medias con
 * datos inventados sería peor que mandar al usuario a `/ingresar`.
 *
 * Los nombres de parámetro son el contrato con `lib/handoff.ts` de la landing
 * (spec §4). El teléfono viaja como `tel`, no como `telefono`.
 */
export function parsearCallback(search: string): Callback | null {
  const parametros = new URLSearchParams(search);

  if (parametros.get('token') !== TOKEN_DEMO) return null;

  const intent = parametros.get('intent');
  const email = (parametros.get('email') ?? '').trim();

  if (intent === 'login') {
    if (email === '') return null;
    return { intent: 'login', email };
  }

  if (intent !== 'alta') return null;

  const tipo = parametros.get('tipo');
  const id = (parametros.get('id') ?? '').trim();

  if (tipo !== 'plan' && tipo !== 'producto') return null;
  if (id === '' || email === '') return null;

  return {
    intent: 'alta',
    tipo,
    id,
    usuario: {
      nombre: (parametros.get('nombre') ?? '').trim(),
      apellido: (parametros.get('apellido') ?? '').trim(),
      email,
      telefono: (parametros.get('tel') ?? '').trim(),
    },
  };
}

/** Enlace de ingreso desde `/ingresar`: mismo origen, así que es una ruta relativa. */
export function construirCallbackLogin(email: string): string {
  const parametros = new URLSearchParams();
  parametros.set('token', TOKEN_DEMO);
  parametros.set('intent', 'login');
  parametros.set('email', email.trim());
  return `/auth/callback?${parametros.toString()}`;
}
