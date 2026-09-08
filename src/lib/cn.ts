/**
 * Concatena clases de Tailwind descartando los condicionales falsos.
 * No resuelve conflictos (no es `tailwind-merge`): el orden lo decide quien
 * llama, y las props `className` van SIEMPRE al final en cada primitivo.
 */
export type ClaseCondicional = string | false | null | undefined;

export function cn(...clases: ClaseCondicional[]): string {
  return clases.filter((c): c is string => typeof c === 'string' && c.length > 0).join(' ');
}
