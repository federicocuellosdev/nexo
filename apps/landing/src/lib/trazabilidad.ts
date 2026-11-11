/**
 * Captura de atribución de marketing del browser. Se llama una vez en el
 * momento del alta del lead y devuelve los campos listos para mandar al
 * endpoint POST /leads. Cada campo es opcional: si no está presente en el
 * URL ni en el referrer, se omite — el backend ya persiste solo los
 * campos que recibe.
 */
export interface DatosTrazabilidad {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  fbclid?: string;
  gclid?: string;
  referer?: string;
  landingUrl?: string;
}

function limpio(valor: string | null | undefined): string | undefined {
  if (typeof valor !== 'string') return undefined;
  const t = valor.trim();
  return t.length > 0 ? t.slice(0, 500) : undefined;
}

/**
 * Lee UTMs + fbclid/gclid del `location.search`, el `document.referrer` y la
 * `location.href` como `landingUrl`. Safe en SSR: si no hay `window` devuelve
 * objeto vacío.
 */
export function capturarTrazabilidad(): DatosTrazabilidad {
  if (typeof window === 'undefined') return {};
  const parametros = new URLSearchParams(window.location.search);
  return {
    utmSource: limpio(parametros.get('utm_source')),
    utmMedium: limpio(parametros.get('utm_medium')),
    utmCampaign: limpio(parametros.get('utm_campaign')),
    utmTerm: limpio(parametros.get('utm_term')),
    utmContent: limpio(parametros.get('utm_content')),
    fbclid: limpio(parametros.get('fbclid')),
    gclid: limpio(parametros.get('gclid')),
    referer: limpio(document.referrer),
    landingUrl: limpio(window.location.href),
  };
}
