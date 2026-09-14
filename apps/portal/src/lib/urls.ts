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

/**
 * Origen del propio portal. Es lo que se codifica en el QR de la credencial,
 * junto con el número de afiliado.
 *
 * En la maqueta esto es `http://localhost:5174`, que el celular de un
 * farmacéutico no puede resolver: el QR sólo es escaneable de verdad cuando el
 * portal esté publicado. Se lee en cada llamada, como `landingUrl()`.
 */
export function portalUrl(): string {
  return window.location.origin.replace(/\/+$/, '');
}
