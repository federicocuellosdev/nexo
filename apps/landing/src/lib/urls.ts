const PORTAL_POR_DEFECTO = 'http://localhost:5174';

/**
 * Origen del portal privado. Se lee en cada llamada (no como constante de
 * módulo) para que los tests puedan alternarlo con `vi.stubEnv`.
 */
export function portalUrl(): string {
  const desdeEntorno = import.meta.env.VITE_PORTAL_URL;
  const base =
    typeof desdeEntorno === 'string' && desdeEntorno.trim().length > 0
      ? desdeEntorno.trim()
      : PORTAL_POR_DEFECTO;
  return base.replace(/\/+$/, '');
}
