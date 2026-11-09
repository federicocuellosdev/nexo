import type {
  Beneficiario,
  PerfilPrevinca,
  RelacionBeneficiario,
  Sexo,
  TipoContratacion,
  TipoDocumento,
} from '@/mock/session';

/**
 * El wizard tiene 4 pasos fijos del titular + N pasos dinámicos para los
 * beneficiarios. Como el tipo final es número y no literal, lo dejamos en
 * `number` para no complicar los call sites.
 */
export type PasoPerfil = number;
export const TOTAL_PASOS_TITULAR = 4;

/**
 * Borrador plano (sin `domicilio` anidado) porque un formulario controlado es
 * mucho más simple sobre campos planos. `aPerfil` lo convierte al modelo del
 * spec §5 recién al guardar.
 *
 * Los `| ''` representan "todavía no elegido" en los selects.
 */
export interface BorradorBeneficiario {
  nombre: string;
  apellido: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  sexo: Sexo | '';
  fechaNacimiento: string;
  relacion: RelacionBeneficiario | '';
}

export type ErroresBeneficiario = Partial<Record<keyof BorradorBeneficiario, string>>;

export const BORRADOR_BENEFICIARIO: BorradorBeneficiario = {
  nombre: '',
  apellido: '',
  tipoDocumento: 'DNI',
  numeroDocumento: '',
  sexo: '',
  fechaNacimiento: '',
  relacion: '',
};

export interface BorradorPerfil {
  /**
   * Nombre y apellido NO forman parte de `PerfilPrevinca`: viven en `Usuario`,
   * que es de donde la app los lee (saludo de /inicio, iniciales del avatar,
   * /cuenta). Viajan en el borrador porque el wizard es quien los pide, y
   * salen por `identidadDelBorrador()`, no por `aPerfil()`.
   *
   * Se piden porque quien entra por "Ya tengo cuenta" sólo dio un email, y sin
   * esto se quedaba sin nombre para siempre.
   */
  nombre: string;
  apellido: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  sexo: Sexo | '';
  fechaNacimiento: string;
  calle: string;
  numero: string;
  piso: string;
  departamento: string;
  torre: string;
  localidad: string;
  provincia: string;
  cp: string;
  pais: string;
  tieneObraSocial: 'si' | 'no' | '';
  obraSocial: string;
  tipoContratacion: TipoContratacion | '';
  /** Uno por familiar adherente. Se precarga con N `BORRADOR_BENEFICIARIO`
   *  vacíos al abrir el wizard, según `sesion.familiares`. */
  beneficiarios: BorradorBeneficiario[];
}

export type ErroresPerfil = Partial<Record<keyof BorradorPerfil, string>>;

/**
 * Únicas localidades que la operación de Previnca factura hoy — las mismas que
 * listaba el `<select>` del alta de la 2.0 (`RegistroForm.tsx`). Todas caen
 * bajo Santa Fe, así que la provincia se autocompleta al elegir una. Si en el
 * futuro se amplía la cobertura a otras provincias, hay que convertir esto en
 * pares `{ localidad, provincia }` y adaptar el Select del wizard.
 */
export const LOCALIDADES: readonly string[] = [
  'Rosario',
  'Granadero Baigorria',
  'Villa Gobernador Gálvez',
];

export const PROVINCIA_POR_DEFECTO = 'Santa Fe';

export const BORRADOR_INICIAL: BorradorPerfil = {
  nombre: '',
  apellido: '',
  tipoDocumento: 'DNI',
  numeroDocumento: '',
  sexo: '',
  fechaNacimiento: '',
  calle: '',
  numero: '',
  piso: '',
  departamento: '',
  torre: '',
  localidad: '',
  // Provincia y país fijos para el canal Nexo (Santa Fe / Argentina). El
  // wizard no los pregunta; viajan preseteados en el borrador para que
  // `aPerfil()` + los contratos de /sales sigan recibiéndolos.
  provincia: PROVINCIA_POR_DEFECTO,
  cp: '',
  pais: 'Argentina',
  tieneObraSocial: '',
  obraSocial: '',
  // El wizard ya no lo pregunta: quien completa el perfil desde el portal
  // siempre se da de alta como tomador y beneficiario de su propia cuota.
  // Si en el futuro vuelve a haber alta de "solo tomador" o "solo
  // beneficiario", el campo sigue en el borrador para no romper los
  // consumidores (aPerfil, desdePerfil, SF intake) — hoy queda fijado.
  tipoContratacion: 'tomador-beneficiario',
  beneficiarios: [],
};

/**
 * Borrador con datos de prueba, para pre-cargar el wizard de /perfil/completar
 * en la maqueta. Hace que recorrer el flujo clickeable no requiera tipear
 * nada en cada paso: Enter → Enter → Enter → Guardar. Si hace falta probar
 * errores de validación, se borra manualmente el campo correspondiente.
 *
 * NO se usa desde /cuenta: ahí la precarga viene de `desdePerfil(perfil)` con
 * los valores reales de la sesión. Y si en algún momento la maqueta pasa a
 * ser demo con usuarios reales, hay que vaciarlo a `BORRADOR_INICIAL` desde
 * `PerfilCompletar.tsx`.
 */
export const BORRADOR_DEMO: BorradorPerfil = {
  ...BORRADOR_INICIAL,
  numeroDocumento: '35123456',
  sexo: 'F',
  fechaNacimiento: '1990-04-17',
  calle: 'Córdoba',
  numero: '1234',
  piso: '3',
  departamento: 'B',
  torre: '',
  localidad: 'Rosario',
  provincia: PROVINCIA_POR_DEFECTO,
  cp: '2000',
  tieneObraSocial: 'si',
  obraSocial: 'OSDE',
};

export const PASOS_TITULAR: readonly { numero: PasoPerfil; titulo: string }[] = [
  { numero: 1, titulo: 'Documento' },
  { numero: 2, titulo: 'Datos personales' },
  { numero: 3, titulo: 'Domicilio' },
  { numero: 4, titulo: 'Cobertura y contratación' },
];

/** Alias legacy: `PASOS` sigue exportado para no romper call sites que lo usen
 *  solo para calcular la cantidad total. Nuevos consumidores usan
 *  `pasosDelWizard(cantFamiliares)`. */
export const PASOS = PASOS_TITULAR;

/**
 * Lista completa de pasos para un wizard con `cantFamiliares` beneficiarios.
 * Devuelve los 4 pasos del titular + 1 paso por familiar titulado
 * "Familiar 1", "Familiar 2", etc.
 */
export function pasosDelWizard(
  cantFamiliares: number,
): readonly { numero: PasoPerfil; titulo: string }[] {
  const extras = Array.from({ length: Math.max(0, cantFamiliares) }, (_, i) => ({
    numero: (TOTAL_PASOS_TITULAR + i + 1) as PasoPerfil,
    titulo: cantFamiliares === 1 ? 'Familiar adherente' : `Familiar ${i + 1}`,
  }));
  return [...PASOS_TITULAR, ...extras];
}

const EDAD_MINIMA = 18;

/** Edad cumplida en años enteros. Compara mes y día para no adelantar el cumpleaños. */
function edadEnAnios(nacimiento: Date, hoy: Date): number {
  let anios = hoy.getUTCFullYear() - nacimiento.getUTCFullYear();
  const mes = hoy.getUTCMonth() - nacimiento.getUTCMonth();
  if (mes < 0 || (mes === 0 && hoy.getUTCDate() < nacimiento.getUTCDate())) anios -= 1;
  return anios;
}

export function validarPaso(paso: PasoPerfil, borrador: BorradorPerfil, hoy: Date = new Date()): ErroresPerfil {
  const errores: ErroresPerfil = {};

  if (paso === 1) {
    const numero = borrador.numeroDocumento.trim();
    if (numero === '') {
      errores.numeroDocumento = 'Ingresá tu número de documento';
    } else if (borrador.tipoDocumento === 'DNI') {
      if (!/^\d{7,8}$/.test(numero)) errores.numeroDocumento = 'El DNI son 7 u 8 dígitos, sin puntos';
    } else if (!/^[A-Za-z0-9]{6,}$/.test(numero)) {
      errores.numeroDocumento = 'El pasaporte tiene al menos 6 caracteres';
    }
    return errores;
  }

  if (paso === 2) {
    // Nombre y apellido ya se piden en el alta de la landing (AltaDialog); si
    // la persona entró por "Ya tengo cuenta" los suma después desde /cuenta.
    // Por eso el paso 2 no los valida — sólo sexo y fecha de nacimiento.
    if (borrador.sexo === '') errores.sexo = 'Elegí una opción';

    const fecha = borrador.fechaNacimiento;
    if (fecha === '') {
      errores.fechaNacimiento = 'Ingresá tu fecha de nacimiento';
    } else {
      const nacimiento = new Date(`${fecha}T00:00:00Z`);
      if (Number.isNaN(nacimiento.getTime())) {
        errores.fechaNacimiento = 'Revisá la fecha';
      } else if (nacimiento.getTime() > hoy.getTime()) {
        errores.fechaNacimiento = 'Revisá la fecha: todavía no llegó';
      } else if (edadEnAnios(nacimiento, hoy) < EDAD_MINIMA) {
        errores.fechaNacimiento = `Tenés que ser mayor de ${EDAD_MINIMA} años`;
      }
    }
    return errores;
  }

  if (paso === 3) {
    if (borrador.calle.trim() === '') errores.calle = 'Ingresá la calle';
    if (borrador.numero.trim() === '') errores.numero = 'Ingresá el número';
    if (borrador.localidad.trim() === '') errores.localidad = 'Ingresá la localidad';
    if (borrador.provincia.trim() === '') errores.provincia = 'Ingresá la provincia';
    if (!/^\d{4}$/.test(borrador.cp.trim())) errores.cp = 'El código postal son 4 dígitos';
    if (borrador.pais.trim() === '') errores.pais = 'Ingresá el país';
    // `piso`, `departamento` y `torre` son opcionales a propósito: no todos los
    // domicilios tienen piso o viven en una torre.
    return errores;
  }

  if (paso === 4) {
    // Ni la obra social ni el tipo de contratación bloquean: la primera por
    // obligatoriedad en debate; el segundo porque el wizard ya no lo pregunta
    // (ver `BORRADOR_INICIAL.tipoContratacion`).
    return errores;
  }

  // Paso >= 5: beneficiario. Index 0 = paso 5, index 1 = paso 6, etc.
  const idx = paso - TOTAL_PASOS_TITULAR - 1;
  const b = borrador.beneficiarios[idx];
  if (!b) return errores;
  const erroresBen = validarBeneficiario(b, hoy);
  // Mapeamos al namespace del borrador padre con prefijo para que el wizard
  // sepa a qué input mostrarle el error. Convención `beneficiario_<idx>_<campo>`.
  for (const [k, v] of Object.entries(erroresBen)) {
    (errores as Record<string, string>)[`beneficiario_${idx}_${k}`] = v;
  }
  return errores;
}

/**
 * Valida un beneficiario individual. Se usa desde `validarPaso` (pasos >= 5)
 * y es el único lugar que conoce las reglas de edad / documento del adherente.
 * No tiene edad mínima: Previnca cubre menores con el plan del tomador.
 */
export function validarBeneficiario(b: BorradorBeneficiario, hoy: Date = new Date()): ErroresBeneficiario {
  const errores: ErroresBeneficiario = {};
  if (b.nombre.trim() === '') errores.nombre = 'Ingresá el nombre';
  if (b.apellido.trim() === '') errores.apellido = 'Ingresá el apellido';

  const numero = b.numeroDocumento.trim();
  if (numero === '') {
    errores.numeroDocumento = 'Ingresá el número de documento';
  } else if (b.tipoDocumento === 'DNI' && !/^\d{7,8}$/.test(numero)) {
    errores.numeroDocumento = 'El DNI son 7 u 8 dígitos, sin puntos';
  } else if (b.tipoDocumento === 'Pasaporte' && !/^[A-Za-z0-9]{6,}$/.test(numero)) {
    errores.numeroDocumento = 'El pasaporte tiene al menos 6 caracteres';
  }

  if (b.sexo === '') errores.sexo = 'Elegí una opción';

  if (b.fechaNacimiento === '') {
    errores.fechaNacimiento = 'Ingresá la fecha de nacimiento';
  } else {
    const nacimiento = new Date(`${b.fechaNacimiento}T00:00:00Z`);
    if (Number.isNaN(nacimiento.getTime())) {
      errores.fechaNacimiento = 'Revisá la fecha';
    } else if (nacimiento.getTime() > hoy.getTime()) {
      errores.fechaNacimiento = 'Revisá la fecha: todavía no llegó';
    }
  }

  if (b.relacion === '') errores.relacion = 'Elegí la relación con el titular';
  return errores;
}

export function aPerfil(borrador: BorradorPerfil): PerfilPrevinca {
  if (borrador.sexo === '' || borrador.tipoContratacion === '') {
    throw new Error('El borrador del perfil está incompleto');
  }
  // `tipoContratacion` nunca llega vacío desde el wizard (ver
  // `BORRADOR_INICIAL`), pero el check se mantiene por si entra por otra vía.

  const piso = borrador.piso.trim();
  const departamento = borrador.departamento.trim();
  const torre = borrador.torre.trim();

  return {
    tipoDocumento: borrador.tipoDocumento,
    numeroDocumento: borrador.numeroDocumento.trim(),
    sexo: borrador.sexo,
    fechaNacimiento: borrador.fechaNacimiento,
    domicilio: {
      calle: borrador.calle.trim(),
      numero: borrador.numero.trim(),
      ...(piso !== '' ? { piso } : {}),
      ...(departamento !== '' ? { departamento } : {}),
      ...(torre !== '' ? { torre } : {}),
      localidad: borrador.localidad.trim(),
      provincia: borrador.provincia.trim(),
      cp: borrador.cp.trim(),
      pais: borrador.pais.trim(),
    },
    tieneObraSocial: borrador.tieneObraSocial === 'si',
    ...(borrador.tieneObraSocial === 'si' && borrador.obraSocial.trim() !== ''
      ? { obraSocial: borrador.obraSocial.trim() }
      : {}),
    tipoContratacion: borrador.tipoContratacion,
    ...(borrador.beneficiarios.length > 0
      ? { beneficiarios: borrador.beneficiarios.map(toBeneficiario) }
      : {}),
  };
}

function toBeneficiario(b: BorradorBeneficiario): Beneficiario {
  if (b.sexo === '' || b.relacion === '') {
    throw new Error('Beneficiario incompleto');
  }
  return {
    nombre: b.nombre.trim(),
    apellido: b.apellido.trim(),
    tipoDocumento: b.tipoDocumento,
    numeroDocumento: b.numeroDocumento.trim(),
    sexo: b.sexo,
    fechaNacimiento: b.fechaNacimiento,
    relacion: b.relacion,
  };
}

/**
 * Nombre y apellido, listos para escribir sobre `Usuario`.
 *
 * Existe como función aparte de `aPerfil()` a propósito: son dos destinos
 * distintos del store (`usuario` y `perfil`) y mezclarlos invitaría a guardar
 * el nombre dentro del perfil, duplicando la fuente de verdad.
 */
export function identidadDelBorrador(borrador: BorradorPerfil): { nombre: string; apellido: string } {
  return { nombre: borrador.nombre.trim(), apellido: borrador.apellido.trim() };
}

/**
 * Para reabrir el wizard desde `/cuenta` con los datos ya cargados.
 *
 * `identidad` va aparte porque nombre y apellido no viven en el perfil sino en
 * el usuario. Es opcional para no romper a quien sólo tenga el perfil a mano;
 * en ese caso los campos abren vacíos y el paso 2 los pedirá.
 */
export function desdePerfil(
  perfil: PerfilPrevinca,
  identidad?: { nombre: string; apellido: string },
): BorradorPerfil {
  return {
    nombre: identidad?.nombre ?? '',
    apellido: identidad?.apellido ?? '',
    tipoDocumento: perfil.tipoDocumento,
    numeroDocumento: perfil.numeroDocumento,
    sexo: perfil.sexo,
    fechaNacimiento: perfil.fechaNacimiento,
    calle: perfil.domicilio.calle,
    numero: perfil.domicilio.numero,
    piso: perfil.domicilio.piso ?? '',
    departamento: perfil.domicilio.departamento ?? '',
    torre: perfil.domicilio.torre ?? '',
    localidad: perfil.domicilio.localidad,
    provincia: perfil.domicilio.provincia,
    cp: perfil.domicilio.cp,
    pais: perfil.domicilio.pais,
    tieneObraSocial: perfil.tieneObraSocial ? 'si' : 'no',
    obraSocial: perfil.obraSocial ?? '',
    tipoContratacion: perfil.tipoContratacion,
    beneficiarios: (perfil.beneficiarios ?? []).map((b) => ({
      nombre: b.nombre,
      apellido: b.apellido,
      tipoDocumento: b.tipoDocumento,
      numeroDocumento: b.numeroDocumento,
      sexo: b.sexo,
      fechaNacimiento: b.fechaNacimiento,
      relacion: b.relacion,
    })),
  };
}
