/**
 * Términos y Condiciones de Previnca Salud.
 *
 * TEXTO LEGAL: se transcribe LITERAL, tal como lo aportó el cliente. No se
 * corrige ortografía, puntuación ni redacción, no se resume y no se completa
 * nada. Cualquier cambio lo decide Previnca sobre el documento original, no
 * quien maqueta la página.
 *
 * Dos cosas del original que quedan tal cual y conviene tener presentes:
 *  1. La numeración SALTA de la cláusula 16 a la 20 (no hay 17, 18 ni 19).
 *  2. El original alterna "CLAUSULA" (cláusulas 1 y 2) y "CLÁUSULA" (el resto).
 *     Acá el número y el título viajan por separado, así que esa inconsistencia
 *     no se traslada al render, pero el texto de los párrafos no se tocó.
 */

/** Ítem de una lista numerada dentro de una cláusula. */
export interface ItemClausula {
  /** Encabezado del ítem, cuando el original lo trae en negrita seguido de dos puntos. */
  titulo?: string;
  texto: string;
}

export type BloqueClausula =
  | { tipo: 'parrafo'; texto: string }
  | { tipo: 'lista'; items: ItemClausula[] };

export interface Clausula {
  /** Número tal como figura en el original. Ojo: la secuencia salta de 16 a 20. */
  numero: number;
  titulo: string;
  bloques: BloqueClausula[];
}

export const CLAUSULAS: Clausula[] = [
  {
    numero: 1,
    titulo: 'Identificación del prestador y objeto del servicio de intermediación',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'Previnca S.A. CUIT: 30-68914068-4, en adelante "Previnca Salud", opera exclusivamente como una plataforma digital de intermediación y gestión de servicios de salud. Su objeto principal es facilitar a los usuarios el acceso a una red de prestadores médicos, asistenciales, odontológicos y de emergencias que son terceros independientes, (en adelante, los "Prestadores").',
      },
      {
        tipo: 'parrafo',
        texto:
          'Previnca Salud no es prestador directo de servicios de salud en los términos de la Ley N° 26.682 y su reglamentación. La relación contractual de Previnca Salud con el usuario se limita a la provisión de la plataforma tecnológica, los servicios de intermediación para la gestión de turnos, el acceso a información de los Prestadores y la administración de beneficios asociados a la afiliación.',
      },
      {
        tipo: 'parrafo',
        texto:
          'La prestación efectiva de los servicios de salud, incluyendo diagnósticos, actos médicos, odontológicos o de emergencias, es responsabilidad exclusiva de los Prestadores. Estos actúan de forma independiente y bajo su propia dirección y control, siendo los únicos responsables por la calidad, idoneidad, oportunidad o resultado de las prestaciones médicas brindadas, así como por los daños que pudieran derivarse de su atención directa.',
      },
      {
        tipo: 'parrafo',
        texto:
          'Previnca Salud no asume responsabilidad por los actos u omisiones de los Prestadores, ni por la calidad de los servicios médicos que estos brinden, salvo por el incumplimiento de sus propias obligaciones como intermediario y gestor de la plataforma, o por la falta de diligencia en la provisión de su servicio tecnológico. La responsabilidad de Previnca Salud se enmarcará en su rol de facilitador tecnológico, no de garante de los resultados médicos de terceros.',
      },
    ],
  },
  {
    numero: 2,
    titulo: 'Objeto del servicio y modalidad de afiliación',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'La afiliación a NEXO se realiza de forma exclusivamente digital, a través de la plataforma tecnológica provista por la empresa. Mediante este proceso, el usuario declara haber leído, comprendido y aceptado los presentes Términos y Condiciones, constituyendo su consentimiento electrónico un acuerdo de voluntades válido y vinculante. Previnca Salud, en su rol de intermediario y gestor de servicios de salud, facilita el acceso a una red de Prestadores y a un conjunto de prestaciones de salud que se detallan en el plan. La información sobre las características esenciales de los servicios y las condiciones de su comercialización será provista de forma cierta, clara y detallada.',
      },
      {
        tipo: 'parrafo',
        texto:
          'El acceso efectivo a las prestaciones y servicios se encuentra estrictamente supeditado al cumplimiento concurrente de los siguientes requisitos: a) la correcta finalización del proceso de afiliación digital y b) la acreditación del pago de la cuota correspondiente al período en curso.',
      },
      {
        tipo: 'parrafo',
        texto:
          'Adicionalmente a las prestaciones incluidas en la afiliación, el usuario tendrá la posibilidad de contratar prestaciones adicionales bajo demanda ("pay per use") a través de la plataforma. Estas prestaciones no forman parte de la tarifa de afiliación básica y serán abonadas de forma individual al momento de su solicitud. Los precios de estos servicios adicionales, así como cualquier coseguro asociado a las prestaciones, serán informados de manera clara y fehaciente al usuario antes de su contratación, y cualquier variación en sus valores será notificada con la antelación legalmente requerida.',
      },
    ],
  },
  {
    numero: 3,
    titulo: 'Ámbito geográfico de cobertura y modificaciones',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'El servicio de intermediación y gestión de prestaciones de salud de Previnca Salud se encuentra disponible, al momento de la afiliación digital del usuario, exclusivamente en la zona geográfica de la Ciudad de Rosario, Granadero Baigorria y Villa Gobernador Gálvez. Esta delimitación inicial de la zona de cobertura será informada de manera clara, precisa y veraz al usuario antes de la contratación, y su aceptación mediante el "click" de alta implicará la conformidad con este ámbito geográfico específico.',
      },
      {
        tipo: 'parrafo',
        texto:
          'Cualquier modificación que implique una alteración en el ámbito geográfico de las prestaciones será comunicada a los usuarios a través del sitio web nexo.previncasalud.com.ar.',
      },
    ],
  },
  {
    numero: 4,
    titulo: 'Condiciones de afiliación y veracidad de la información',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'A los fines de la afiliación a NEXO, será requisito excluyente que el titular sea mayor de edad, debiendo contar con dieciocho (18) años cumplidos al momento de la solicitud.',
      },
      {
        tipo: 'parrafo',
        texto:
          'La afiliación implica la aceptación expresa e incondicional de la totalidad de los presentes Términos y Condiciones, así como de las políticas y procedimientos que los complementen, lo cual se formalizará mediante el consentimiento electrónico del usuario al momento de completar el proceso de alta digital.',
      },
    ],
  },
  {
    numero: 5,
    titulo: 'Modalidad de contratación y consentimiento electrónico',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'La contratación de los servicios de Previnca Salud se realiza de forma 100% digital, en la modalidad de comercio electrónico (e-commerce), a través de la plataforma web nexo.previncasalud.com.ar. Esta modalidad se encuadra dentro de los contratos celebrados a distancia, entendiendo por tales aquellos concluidos con el uso exclusivo de medios de comunicación electrónicos, sin la presencia física simultánea de las partes. El consentimiento del usuario se perfecciona mediante la aceptación expresa de los presentes Términos y Condiciones a través de un "click" en el botón o ícono correspondiente ("clickwrap") en la plataforma digital.',
      },
    ],
  },
  {
    numero: 6,
    titulo: 'Servicios incluidos en la afiliación y sus condiciones',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'La afiliación a NEXO y la acreditación del pago de la cuota correspondiente al período en curso otorga al usuario acceso a un conjunto de CUATRO prestaciones de salud específicamente incluidas en la tarifa de afiliación, detalladas a continuación.',
      },
      {
        tipo: 'lista',
        items: [
          {
            titulo: 'Telemedicina',
            texto:
              'La telemedicina se entiende como un servicio asistencial y/o consulta realizada a distancia, utilizando tecnologías adecuadas para garantizar la prestación oportuna y de calidad, especialmente en un contexto de demanda esencial. Previnca Salud determinará la cantidad de sesiones o consultas autorizadas y los procesos de auditoría de estas prestaciones.',
          },
          {
            titulo: 'Guardias Odontológicas',
            texto:
              'Se facilitará el acceso a guardias odontológicas a través de un prestador tercerizado. El alcance del servicio de urgencia odontológica abarca únicamente las prácticas de medicación, radiografías y apertura de piezas dentarias con fines paliativos. El tratamiento posterior y definitivo de la pieza dentaria no se encuentra incluido en esta modalidad de atención.',
          },
          {
            titulo: 'Emergencias médicas',
            texto:
              'El servicio de atención médica se limita de manera exclusiva a las prestaciones derivadas de emergencias y urgencias médicas. Queda expresamente excluido de la presente cobertura el servicio de consulta o visita médica programada a domicilio.',
          },
          {
            titulo: 'Descuentos en Farmacia',
            texto:
              'Los usuarios afiliados tendrán acceso a descuentos en farmacia a través de una red de prestadores cerrada y un vademécum acotado, según los acuerdos establecidos con el colegio farmacéutico.',
          },
        ],
      },
      {
        tipo: 'parrafo',
        texto:
          'Previnca Salud, en su rol de intermediario, se esforzará por garantizar la continuidad y calidad de los servicios, pero no asume la responsabilidad directa por la prestación médica en sí, la cual recae en los Prestadores. En caso de que alguna prestación implique un coseguro, su valor será debidamente informado al momento de la afiliación.',
      },
    ],
  },
  {
    numero: 7,
    titulo: 'Servicios adicionales (on-demand)',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'Adicionalmente a las prestaciones incluidas en la afiliación básica, NEXO ofrece a sus usuarios la posibilidad de contratar servicios de salud adicionales bajo demanda ("pay per use") a través de su plataforma digital. Estas prestaciones no forman parte de la tarifa de afiliación mensual y serán abonadas de forma individual por el usuario al momento de su solicitud y confirmación.',
      },
    ],
  },
  {
    numero: 8,
    titulo: 'Zonas restringidas o de riesgo para la prestación de servicios',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'Previnca Salud, en su compromiso de garantizar la seguridad y calidad de la atención sanitaria, así como la integridad física de los Prestadores, se reserva la facultad de no prestar servicios en determinadas zonas geográficas que, por razones objetivas de seguridad pública o riesgo inminente para la vida o integridad de las personas, sean calificadas como "zonas restringidas" o "zonas rojas". Esta delimitación del riesgo se fundamenta en la necesidad de proteger al personal que debe concurrir a brindar las prestaciones, y no implicará un incumplimiento contractual por parte de Previnca Salud. La calificación de una zona como restringida o de riesgo se basará en criterios objetivos y verificables, y no en el mero arbitrio de Previnca Salud.',
      },
    ],
  },
  {
    numero: 9,
    titulo: 'Obligaciones del usuario',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'El usuario de Previnca Salud se compromete a cumplir con las siguientes obligaciones, esenciales para la correcta prestación y aprovechamiento de los servicios de intermediación y gestión de salud, en un marco de buena fe y colaboración mutua:',
      },
      {
        tipo: 'lista',
        items: [
          {
            titulo: 'Uso Adecuado del Servicio y Cooperación',
            texto:
              'El usuario se obliga a utilizar la plataforma y los servicios ofrecidos por Previnca Salud de manera diligente y responsable, siguiendo las indicaciones y protocolos establecidos para cada prestación. Esto incluye, pero no se limita a, cumplir con las indicaciones médicas o de los Prestadores y cooperar activamente en su propio proceso de atención de salud. La falta de colaboración del paciente con el profesional puede ser un factor relevante en la evaluación de la responsabilidad.',
          },
          {
            titulo: 'Veracidad y Actualización de la Información',
            texto:
              'El usuario deberá proporcionar información completa, clara y veraz sobre su identidad, datos de contacto y estado de salud al momento de la afiliación y cada vez que le sea requerida para la prestación de un servicio. Asimismo, se compromete a mantener actualizada dicha información. La falsedad, inexactitud u omisión deliberada de datos o información relevante, que demuestre una conducta de mala fe, podrá dar lugar a la resolución del contrato por parte de Previnca Salud, siempre que se acredite fehacientemente la mala fe del usuario en los términos del artículo 961 del Código Civil y Comercial de la Nación.',
          },
          {
            titulo: 'Trato Digno y Respetuoso',
            texto:
              'El usuario se compromete a dispensar un trato digno y respetuoso al personal de los Prestadores y a cualquier otro profesional o auxiliar que intervenga en la prestación de los servicios, así como a sus familiares o acompañantes, en consonancia con el derecho del paciente a un trato digno y respetuoso.',
          },
          {
            titulo: 'Permitir Acceso al Domicilio',
            texto:
              'En aquellos casos en que la naturaleza del servicio lo requiera (ej. atención de urgencias médicas domiciliarias), el usuario se obliga a permitir el acceso seguro y oportuno del personal de los Prestadores a su domicilio o al lugar donde se encuentre el paciente, una vez coordinada la atención.',
          },
        ],
      },
    ],
  },
  {
    numero: 10,
    titulo: 'Precio y forma de pago',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'El usuario se obliga al pago de los costos de afiliación, suscripción mensual y, en su caso, de los servicios adicionales contratados bajo demanda ("pay per use"), conforme a los valores y condiciones que se detallan en el plan de afiliación y en la información específica de cada servicio. Previnca Salud se compromete a suministrar al usuario, de forma cierta, clara y detallada, toda la información relacionada con las características esenciales de los servicios y las condiciones de su comercialización, incluyendo su cuantía, modo de determinación o actualización, y la existencia de aranceles complementarios o coseguros.',
      },
      {
        tipo: 'parrafo',
        texto:
          'Previnca Salud podrá establecer libremente los valores de las cuotas de los planes de salud ofrecidos durante toda la vigencia del contrato, y el porcentaje de ajuste podrá variar según las características específicas del plan.',
      },
      {
        tipo: 'parrafo',
        texto:
          'Los métodos de pago aceptados por Previnca Salud incluyen, entre otros, la utilización de plataformas de pago digital como Mercado Pago y otras billeteras virtuales, así como la generación de links de pago. El proceso de alta y la gestión de pagos se realizará a través de la plataforma digital de Previnca Salud, donde el usuario podrá vincular sus medios de pago. Los pagos realizados mediante códigos de respuesta rápida (QR) se considerarán medios de pago equivalentes. En caso de generarse cuentas pendientes de pago en la billetera virtual del usuario o mediante links de pago, Previnca Salud notificará al usuario para su regularización.',
      },
    ],
  },
  {
    numero: 11,
    titulo: 'Revocación de la aceptación, suspensión y baja del servicio',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'Revocación de la aceptación: El usuario tiene derecho a revocar la aceptación del servicio contratado dentro del plazo de diez (10) días corridos contados a partir de la fecha de la afiliación. A tal efecto, podrá utilizar el "Botón de Arrepentimiento" dispuesto de manera visible en la plataforma web. Constituye una condición esencial e indispensable para la procedencia de esta revocación que el servicio no haya sido utilizado dentro del mencionado plazo.',
      },
      {
        tipo: 'parrafo',
        texto:
          'Suspensión del servicio: La falta de pago de una (1) cuota mensual facultará a la Compañía a disponer la suspensión automática del servicio. Previnca Salud notificará la suspensión e intimará al usuario al pago de la suma adeudada.',
      },
      {
        tipo: 'parrafo',
        texto:
          'La extinción del vínculo contractual con Previnca Salud puede originarse por decisión del usuario o por resolución de Previnca Salud, conforme a las siguientes condiciones:',
      },
      {
        tipo: 'lista',
        items: [
          {
            titulo: 'Rescisión por Decisión del Usuario',
            texto:
              'El usuario podrá rescindir el contrato de afiliación en cualquier momento, sin limitación alguna y sin penalidad. Para evitar el ejercicio abusivo de este derecho, el mismo podrá ser ejercido solamente una (1) vez por año. La solicitud de baja podrá realizarse a través de la plataforma digital de Previnca Salud, mediante un mecanismo de "botón de baja" de fácil acceso y directo, que simplifique la gestión y agilice el proceso.',
          },
          {
            titulo: 'Resolución por Parte de Previnca Salud',
            texto:
              'Previnca Salud podrá resolver el vínculo contractual únicamente por las siguientes causales: a) Por falta de pago: En caso de falta de pago de tres (3) cuotas íntegras y consecutivas, Previnca Salud podrá resolver el vínculo contractual de manera automática, con la finalidad de impedir el devengamiento de nuevos períodos de facturación, notificando al usuario de la resolución. b) Por falsedad de los datos brindados.',
          },
        ],
      },
    ],
  },
  {
    numero: 12,
    titulo: 'Modificación de términos y condiciones',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'Previnca Salud se reserva la facultad de modificar los presentes Términos y Condiciones en cualquier momento. En caso de que el usuario no esté de acuerdo con las modificaciones introducidas, tendrá la opción de rescindir el contrato sin cargo ni penalidad alguna, ejerciendo su derecho de baja conforme a lo establecido en la Cláusula 11, sin que ello genere derecho a indemnización alguna por parte de Previnca Salud.',
      },
    ],
  },
  {
    numero: 13,
    titulo: 'Responsabilidad de Previnca Salud y de los Prestadores',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'Previnca Salud opera exclusivamente como una plataforma digital de intermediación y gestión de servicios de salud, facilitando el acceso de los usuarios a una red de Prestadores médicos, asistenciales, odontológicos y de emergencias que son terceros independientes. En tal sentido, Previnca Salud no es el prestador directo de las prestaciones médicas, y su responsabilidad se limita a la provisión y el adecuado funcionamiento de la plataforma tecnológica, los servicios de intermediación para la gestión de turnos, el acceso a información de los Prestadores y la administración de los beneficios asociados a la afiliación.',
      },
      {
        tipo: 'parrafo',
        texto:
          'La prestación efectiva de los servicios de salud, incluyendo diagnósticos, actos médicos, odontológicos o de emergencias, es responsabilidad exclusiva de los Prestadores. Estos actúan de forma independiente y bajo su propia dirección y control, siendo los únicos responsables por la calidad, idoneidad, oportunidad o resultado de las prestaciones médicas brindadas, así como por los daños que pudieran derivarse de su atención directa.',
      },
    ],
  },
  {
    numero: 14,
    titulo: 'Protección de datos personales y confidencialidad',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'Previnca Salud se compromete a proteger la privacidad y la confidencialidad de los datos personales de sus usuarios, en estricto cumplimiento de la Ley N° 25.326 de Protección de los Datos Personales, su Decreto Reglamentario N° 1558/2001, la Ley N° 26.529 de Derechos del Paciente y su Decreto Reglamentario N° 1089/2012, así como toda la normativa complementaria y concordante en la materia.',
      },
    ],
  },
  {
    numero: 15,
    titulo: 'Comunicaciones y notificaciones',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'El usuario acepta que todas las notificaciones, comunicaciones y avisos relacionados con los presentes Términos y Condiciones, la prestación de los servicios de Previnca Salud y la gestión de su afiliación, se realizarán de forma válida y eficaz a través de medios digitales y electrónicos. La utilización de comunicaciones electrónicas y domicilios electrónicos constituidos posee idéntica eficacia jurídica y valor probatorio que sus equivalentes convencionales.',
      },
      {
        tipo: 'lista',
        items: [
          {
            titulo: 'Domicilio Electrónico y Canales Formales de Notificación',
            texto:
              'El domicilio electrónico del usuario será el canal principal y formal para todas las notificaciones vinculantes. Este domicilio se constituirá a través de la cuenta de usuario en la plataforma de Previnca Salud (sitio web) y/o la dirección de correo electrónico que el usuario haya registrado y validado al momento de la afiliación. Las notificaciones se considerarán perfeccionadas y válidas a partir de la fecha y hora en que queden disponibles en la bandeja de comunicaciones de la plataforma o en la casilla de correo electrónico registrada. En caso de que el usuario haya registrado múltiples domicilios electrónicos y no haya designado uno principal, la notificación realizada en cualquiera de ellos se considerará válida para todos los intervinientes.',
          },
          {
            titulo: 'Circuito de Comunicaciones de Mora en el Pago',
            texto:
              'En caso de mora en el pago de una (1) cuota, Previnca Salud notificará al usuario la suspensión del servicio a través de su domicilio electrónico constituido (plataforma y/o correo electrónico). Esta comunicación incluirá la intimación para regularizar la situación en el plazo establecido, detallando las sumas adeudadas y las consecuencias de la falta de pago. La interpelación electrónica para constituir en mora al deudor asume eficacia probatoria como documento electrónico.',
          },
          {
            titulo: 'Circuito de Comunicaciones de Baja del Servicio',
            texto:
              'Las comunicaciones relativas a la baja del servicio, ya sea por decisión del usuario o por resolución de Previnca Salud, se realizarán a través del domicilio electrónico constituido del usuario. Previnca Salud enviará una constancia fehaciente de la recepción del pedido de rescisión o de la notificación de la resolución contractual, y de la fecha de su impacto.',
          },
          {
            titulo: 'Avisos de Cortesía',
            texto:
              'Previnca Salud podrá utilizar otros medios de comunicación digital, como notificaciones push en la aplicación móvil, mensajes SMS o WhatsApp, para enviar avisos de cortesía, recordatorios o información de interés general. Sin embargo, estos avisos no revisten el carácter de notificación formal y su falta de recepción, cualquiera sea el motivo, no afectará en modo alguno la validez de las notificaciones realizadas a través del domicilio electrónico constituido.',
          },
        ],
      },
    ],
  },
  {
    numero: 16,
    titulo: 'Legislación aplicable y jurisdicción',
    bloques: [
      {
        tipo: 'parrafo',
        texto: 'Los presentes Términos y Condiciones se regirán por el Código Civil y Comercial de la Nación.',
      },
      {
        tipo: 'parrafo',
        texto:
          'En lo que respecta a la jurisdicción para la resolución de cualquier controversia o litigio derivado de la interpretación, validez, celebración, cumplimiento o incumplimiento de los presentes Términos y Condiciones, serán competentes los Tribunales Provinciales de Rosario.',
      },
    ],
  },
  {
    // El original salta de la 16 a la 20. Se respeta la numeración de la fuente:
    // renumerar un documento legal por prolijidad visual cambia las referencias
    // cruzadas y las citas externas.
    numero: 20,
    titulo: 'Aceptación de los términos y condiciones',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'Al completar el proceso de afiliación digital y hacer "click" en el botón de aceptación correspondiente, el usuario declara expresamente haber leído, comprendido y aceptado la totalidad de los presentes Términos y Condiciones, así como la Política de Privacidad y cualquier otro anexo o documento complementario que forme parte integral del contrato. Esta manifestación de voluntad constituye un consentimiento electrónico válido y vinculante para las partes.',
      },
    ],
  },
];

/** Ancla estable por cláusula, para enlazar a una en particular. */
export function anclaClausula(numero: number): string {
  return `clausula-${numero}`;
}
