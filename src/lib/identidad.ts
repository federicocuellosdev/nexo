import type { Usuario } from '@/mock/session';

/**
 * Cómo saludar y cómo mostrar a alguien que puede NO tener nombre cargado.
 *
 * No es paranoia defensiva: es el camino normal del login. Quien entra por
 * "Ya tengo cuenta" sólo escribe un email, así que su `usuario` queda con
 * `nombre` y `apellido` en cadena vacía. Y el wizard de perfil pide documento,
 * domicilio y obra social — nunca el nombre. Ese socio nunca lo carga.
 *
 * Sin esto la pantalla mostraba "Hola, " con la coma colgando y un avatar
 * violeta sin ninguna letra adentro. Ojo con `?? ''`: no alcanza, porque el
 * valor no es `undefined` sino `''`.
 */

/** Parte del email antes del `@`, que es lo más parecido a un nombre que hay. */
function alias(email: string): string {
  const local = email.split('@')[0] ?? '';
  return local.trim();
}

/**
 * Saludo completo, listo para pintar. Devuelve "Hola, Camila" cuando hay
 * nombre y "Hola" a secas cuando no — nunca "Hola, " con la coma huérfana.
 */
export function saludo(usuario: Usuario | undefined): string {
  const nombre = usuario?.nombre?.trim() ?? '';
  return nombre === '' ? 'Hola' : `Hola, ${nombre}`;
}

/**
 * Iniciales para el avatar. Cae al email cuando no hay nombre, y a un guion
 * cuando no hay nada: un círculo de color vacío no se lee como avatar, se lee
 * como un error de carga.
 */
export function iniciales(usuario: Usuario | undefined): string {
  if (usuario === undefined) return '—';

  const nombre = usuario.nombre?.trim() ?? '';
  const apellido = usuario.apellido?.trim() ?? '';
  const deNombre = `${nombre.charAt(0)}${apellido.charAt(0)}`.trim();
  if (deNombre !== '') return deNombre.toUpperCase();

  const deEmail = alias(usuario.email ?? '').charAt(0);
  return deEmail === '' ? '—' : deEmail.toUpperCase();
}

/**
 * Nombre visible en el bloque de identidad del Sidebar. Cae al email, que
 * siempre existe: es el único dato que el login pide sí o sí.
 */
export function nombreVisible(usuario: Usuario | undefined): string {
  if (usuario === undefined) return '';

  const completo = `${usuario.nombre ?? ''} ${usuario.apellido ?? ''}`.trim();
  return completo === '' ? (usuario.email ?? '') : completo;
}
