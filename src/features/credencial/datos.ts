import type { Session } from '@/mock/session';
import { coberturaActiva } from '@/lib/estado';
import { nombreVisible } from '@/lib/identidad';
import { planContratado, proximoVencimiento } from '@/features/cobertura/contrataciones';
import type { DatosCredencial } from '@/features/credencial/CredencialCard';

/**
 * Arma los datos de la credencial a partir de la sesión, o `undefined` si no
 * corresponde mostrarla.
 *
 * VISIBILIDAD POR ESTADO, y esto es la regla de negocio, no una comodidad: en
 * el portal del socio la credencial existe SÓLO con la cobertura activa. En los
 * otros estados la pantalla ya muestra su propio bloque —"Completá tu perfil",
 * "Todavía no registramos tu pago"— y encima de eso una credencial sería una
 * invitación a presentarla en una farmacia que la va a rechazar.
 *
 * Devuelve `undefined` en vez de datos a medias: una credencial sin plan o sin
 * vigencia no es una credencial degradada, es una credencial inválida.
 */
export function credencialDeLaSesion(sesion: Session): DatosCredencial | undefined {
  if (!coberturaActiva(sesion)) return undefined;

  const { numeroAfiliado } = sesion;
  const plan = planContratado(sesion);
  const vigenteHasta = proximoVencimiento(sesion);
  if (numeroAfiliado === undefined || plan === undefined || vigenteHasta === undefined) {
    return undefined;
  }

  return {
    nombre: nombreVisible(sesion.usuario),
    plan: plan.nombre,
    numeroAfiliado,
    vigenteHasta,
  };
}
