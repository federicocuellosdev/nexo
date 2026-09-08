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
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  sexo: Sexo | '';
  fechaNacimiento: string;
  calle: string;
  numero: string;
  piso: string;
  localidad: string;
  provincia: string;
  cp: string;
  tieneObraSocial: 'si' | 'no' | '';
  obraSocial: string;
  tipoContratacion: TipoContratacion | '';
}

export type ErroresPerfil = Partial<Record<keyof BorradorPerfil, string>>;

export const BORRADOR_INICIAL: BorradorPerfil = {
  tipoDocumento: 'DNI',
  numeroDocumento: '',
  sexo: '',
  fechaNacimiento: '',
  calle: '',
  numero: '',
  piso: '',
  localidad: '',
  provincia: '',
  cp: '',
  tieneObraSocial: '',
  obraSocial: '',
  tipoContratacion: '',
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
    // `piso` es opcional a propósito: hay domicilios sin piso.
    return errores;
  }

  // Paso 4. La obra social NO bloquea: su obligatoriedad está en debate
  // (docs/CONTEXTO.md) y en la maqueta lleva el badge "opcional · a definir".
  if (borrador.tipoContratacion === '') errores.tipoContratacion = 'Elegí el tipo de contratación';
  return errores;
}

export function aPerfil(borrador: BorradorPerfil): PerfilPrevinca {
  if (borrador.sexo === '' || borrador.tipoContratacion === '') {
    throw new Error('El borrador del perfil está incompleto');
  }

  const piso = borrador.piso.trim();

  return {
    tipoDocumento: borrador.tipoDocumento,
    numeroDocumento: borrador.numeroDocumento.trim(),
    sexo: borrador.sexo,
    fechaNacimiento: borrador.fechaNacimiento,
    domicilio: {
      calle: borrador.calle.trim(),
      numero: borrador.numero.trim(),
      ...(piso !== '' ? { piso } : {}),
      localidad: borrador.localidad.trim(),
      provincia: borrador.provincia.trim(),
      cp: borrador.cp.trim(),
    },
    tieneObraSocial: borrador.tieneObraSocial === 'si',
    ...(borrador.tieneObraSocial === 'si' && borrador.obraSocial.trim() !== ''
      ? { obraSocial: borrador.obraSocial.trim() }
      : {}),
    tipoContratacion: borrador.tipoContratacion,
  };
}

/** Para reabrir el wizard desde `/cuenta` con los datos ya cargados. */
export function desdePerfil(perfil: PerfilPrevinca): BorradorPerfil {
  return {
    tipoDocumento: perfil.tipoDocumento,
    numeroDocumento: perfil.numeroDocumento,
    sexo: perfil.sexo,
    fechaNacimiento: perfil.fechaNacimiento,
    calle: perfil.domicilio.calle,
    numero: perfil.domicilio.numero,
    piso: perfil.domicilio.piso ?? '',
    localidad: perfil.domicilio.localidad,
    provincia: perfil.domicilio.provincia,
    cp: perfil.domicilio.cp,
    tieneObraSocial: perfil.tieneObraSocial ? 'si' : 'no',
    obraSocial: perfil.obraSocial ?? '',
    tipoContratacion: perfil.tipoContratacion,
  };
}
