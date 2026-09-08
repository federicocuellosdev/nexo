const LANDING_POR_DEFECTO = 'http://localhost:5173';

/**
 * Origen del sitio público. Se lee en cada llamada (no como constante de
 * módulo) para que los tests puedan alternarlo con `vi.stubEnv`.
 */
export function landingUrl(): string {
  const desdeEntorno = import.meta.env.VITE_LANDING_URL;
  const base =
    typeof desdeEntorno === 'string' && desdeEntorno.trim().length > 0
      ? desdeEntorno.trim()
      : LANDING_POR_DEFECTO;
  return base.replace(/\/+$/, '');
}
