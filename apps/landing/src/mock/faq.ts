/**
 * Preguntas frecuentes principales de Nexo, portadas de Nexo 2.0
 * (`docs/referencia/faq.nexo-2.0.ts`) y recortadas a las 5 más relevantes
 * para quien está evaluando contratar: cómo suscribirse, cuándo empezar,
 * cómo usar, cómo se cobra y cómo cancelar. Las preguntas secundarias
 * (recuperación de cuenta, vademécum, privacidad, etc.) viven en el portal
 * o se responden por soporte (WhatsApp 341 5056130).
 *
 * Nexo 3.0 vende tres planes (Nexo I/II/III, `src/mock/planes.ts`) con
 * coberturas distintas. Cada respuesta que nombraba un beneficio como si
 * fuera universal se revisó contra `planes.ts`: Emergencias médicas solo
 * está en Nexo I; guardia odontológica solo en Nexo I; farmacia en Nexo I
 * y Nexo II. La teleconsulta (Doc24 · Clínica) es la única prestación que
 * está en los TRES planes.
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
    pregunta: '¿Cuándo se cobra y qué pasa si no tengo saldo?',
    respuesta:
      'El cobro se realiza entre el 1 y el 10 de cada mes.\nSi al momento del vencimiento no se acredita el pago, tu cobertura entra en mora. Esto se visualizará en tu perfil mediante una señal amarilla y además recibirás una notificación por WhatsApp.\nUna vez regularizado el pago, la cobertura se reactiva automáticamente.',
  },
  {
    pregunta: '¿Puedo cancelar cuando quiera?',
    respuesta:
      'Sí. No existe permanencia mínima ni penalidades.\nPodés solicitar la baja en cualquier momento y tu cobertura continuará activa hasta finalizar el período ya abonado.',
  },
];
