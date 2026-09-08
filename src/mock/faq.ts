/**
 * Las 12 preguntas frecuentes reales de Nexo, portadas de Nexo 2.0
 * (`docs/referencia/faq.nexo-2.0.ts`, copia verbatim del original).
 * Contenido real y verdadero para Nexo 3.0 (no es "maqueta simulada": los
 * prestadores, precios y contactos son los de Previnca).
 *
 * Nexo 2.0 vendía UN plan; Nexo 3.0 vende tres (Nexo I/II/III, `src/mock/planes.ts`)
 * con coberturas distintas. Cada respuesta que nombraba un beneficio como si
 * fuera universal se revisó contra `planes.ts` y se ajustó si dejaba de ser
 * cierta para alguno de los tres. Sin inventar números: los que aparecen acá
 * son los mismos que ya están en `planes.ts`.
 *
 * CINCO respuestas se adaptaron (no cuatro: la quinta es la que más importa
 * auditar, porque es la que pone precios nuevos frente al cliente):
 *
 * 1. "¿Cómo me suscribo?" — hablaba de "el plan" en singular; ahora hay que
 *    elegir entre tres.
 * 2. "¿Cuándo puedo empezar a usar los servicios?" — dijo que Emergencias
 *    médicas se habilita para todos: en `planes.ts`, Emergencias médicas
 *    SOLO está incluida en Nexo I (Nexo II y III: `no-incluido`). Lo mismo
 *    con guardia odontológica (solo Nexo I) y farmacia (Nexo I y Nexo II,
 *    no Nexo III). La teleconsulta (Doc24 · Clínica) sí es la única
 *    prestación presente en los TRES planes, así que esa parte se mantiene.
 * 3. "¿Cómo uso cada servicio?" — la lista de instrucciones (teleconsulta,
 *    emergencias, farmacia, guardia odontológica) asumía que el lector tenía
 *    las cuatro. Se agrega una aclaración de que depende del plan; las
 *    instrucciones en sí no cambian.
 * 4. "¿Qué hago si perdí acceso a mi cuenta?" — decía "Olvidé mi contraseña",
 *    pero el alta de Nexo 3.0 es con Magic Link, sin contraseña
 *    (`docs/CONTEXTO.md`: "Mensaje 'Revisá tu mail'. Llega un Magic Link
 *    (token, sin contraseña)"). Un botón que promete recuperar una
 *    contraseña que no existe es peor que no tener la pregunta.
 * 5. "¿Cuántas teleconsultas puedo realizar por mes?" — decía "1 sin cargo"
 *    para cualquier plan, pero eso es falso para Nexo III: tiene "Cobertura
 *    de $10.000 · luego $18.000" (un tope en pesos, no una consulta gratis).
 *    Los números ($10.000, $18.000) son los mismos de `planes.ts`; ninguno
 *    se inventó acá.
 *
 * Las otras 7 preguntas viajan sin cambios, con sus datos de contacto reales
 * (WhatsApp 341 5056130, vademécum en nexo.portal.previncasalud.com.ar).
 */
export interface PreguntaFrecuente {
  pregunta: string;
  /** Conserva los saltos de línea (`\n`) del origen: cada uno es un párrafo. */
  respuesta: string;
}

export const FAQ: PreguntaFrecuente[] = [
  {
    pregunta: '¿Cómo me suscribo?',
    respuesta:
      'Elegís uno de los tres planes (Nexo I, II o III) y tocás "Contratar": ahí revisás los servicios incluidos y el valor de ese plan, completás el formulario con tus datos y hacés el pago a través de Mercado Pago.\nTodo el proceso se hace desde el celular, sin papeles y en menos de 5 minutos.',
  },
  {
    pregunta: '¿Cuándo puedo empezar a usar los servicios?',
    respuesta:
      'Una vez confirmado el pago, recibirás tu credencial digital por correo electrónico.\nLa teleconsulta médica (Doc24) está en los tres planes y queda habilitada dentro de las 24 hs hábiles de recibida la credencial.\nEl resto de los servicios que incluya tu plan (emergencias médicas y guardia odontológica en Nexo I; farmacia en Nexo I y Nexo II) tienen una carencia de 30 días; finalizado ese período, ya podés usarlos.',
  },
  {
    pregunta: '¿Cómo uso cada servicio?',
    respuesta:
      'Buscá el tuyo en la lista de abajo (según tu plan, puede que no incluya los cuatro; revisá tu ficha en "Nuestros planes").\nTeleconsultas médicas: Desde Previnca Nexo solicitás la consulta y un profesional te atiende en minutos, las 24 horas.\nEmergencias médicas: Llamás a la línea de atención, indicás que sos cliente Previnca Nexo y brindás tu DNI para recibir asistencia inmediata.\nDescuento en farmacias: Presentando tu receta con el número de farmacia que figura en tu credencial digital, podés acceder al 50% off en más de 6000 medicamentos seleccionados.\nGuardia odontológica: Enviás un mensaje al WhatsApp del prestador para avisar que vas a concurrir y coordinás para acercarte a las instalaciones, en la ciudad de Rosario. Horarios de atención: lunes a viernes de 8 a 20 hs.',
  },
  {
    pregunta: '¿Puedo compartir mi cuenta con otra persona?',
    respuesta: 'No. Cada cuenta es personal e intransferible, y está asociada exclusivamente a la persona titular del servicio.',
  },
  {
    pregunta: '¿Cuándo se cobra y qué pasa si no tengo saldo?',
    respuesta:
      'El cobro se realiza entre el 1 y el 10 de cada mes.\nSi al momento del vencimiento no se acredita el pago, tu cobertura entra en mora. Esto se visualizará en tu perfil mediante una señal amarilla y además recibirás una notificación por WhatsApp.\nUna vez regularizado el pago, la cobertura se reactiva automáticamente.',
  },
  {
    pregunta: '¿Qué hago si perdí acceso a mi cuenta?',
    respuesta:
      'Como el ingreso es con Magic Link (sin contraseña), pedís uno nuevo desde la pantalla de ingreso con tu email y te llega un enlace fresco por correo. Si el inconveniente continúa, comunicate con el equipo de soporte por WhatsApp al 341 5056130.',
  },
  {
    pregunta: '¿Cómo contacto si necesito hacer una consulta sobre el servicio?',
    respuesta:
      'Podés comunicarte con nuestra línea WSP 341 5056130 y recibir asesoramiento personalizado para resolver cualquier duda o consulta sobre el servicio.',
  },
  {
    pregunta: '¿Cuántas teleconsultas puedo realizar por mes?',
    respuesta:
      'Depende de tu plan. Nexo I y Nexo II incluyen 1 teleconsulta médica sin cargo por mes; a partir de la segunda, cada teleconsulta adicional dentro del mismo mes sale $18.000. Nexo III no incluye una consulta gratis, sino una cobertura de $10.000 para teleconsulta; superado ese monto, cada teleconsulta adicional sale $18.000.',
  },
  {
    pregunta: '¿Qué diferencia hay entre una emergencia y una teleconsulta?',
    respuesta:
      'La teleconsulta está orientada a consultas médicas generales o situaciones de baja complejidad.\nLas urgencias están destinadas a situaciones que requieren atención inmediata.',
  },
  {
    pregunta: '¿Qué medicamentos tienen descuento?',
    respuesta:
      'Podés consultar el listado completo de medicamentos con cobertura y descuentos en nuestra página web.\nnexo.portal.previncasalud.com.ar/vademecum',
  },
  {
    pregunta: '¿Mis datos médicos y personales son privados?',
    respuesta:
      'Sí. Toda la información médica y personal se gestiona bajo estándares de privacidad y seguridad para proteger la confidencialidad de cada usuario.',
  },
  {
    pregunta: '¿Puedo cancelar cuando quiera?',
    respuesta:
      'Sí. No existe permanencia mínima ni penalidades.\nPodés solicitar la baja en cualquier momento y tu cobertura continuará activa hasta finalizar el período ya abonado.',
  },
];
