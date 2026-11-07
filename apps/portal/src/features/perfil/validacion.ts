import type { PerfilPrevinca, Sexo, TipoContratacion, TipoDocumento } from '@/mock/session';

export type PasoPerfil = 1 | 2 | 3 | 4;

/**
 * Borrador plano (sin `domicilio` anidado) porque un formulario controlado es
 * mucho más simple sobre campos planos. `aPerfil` lo convierte al modelo del
 * spec §5 recién al guardar.
 *
 * Los `| ''` representan "todavía no elegido" en los selects.
 */
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
  provincia: '',
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

export const PASOS: readonly { numero: PasoPerfil; titulo: string }[] = [
  { numero: 1, titulo: 'Documento' },
  { numero: 2, titulo: 'Datos personales' },
  { numero: 3, titulo: 'Domicilio' },
  { numero: 4, titulo: 'Cobertura y contratación' },
];

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

  // Paso 4. Ni la obra social ni el tipo de contratación bloquean:
  // la primera por obligatoriedad en debate; el segundo porque el wizard
  // ya no lo pregunta (ver `BORRADOR_INICIAL.tipoContratacion`).
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
  };
}
