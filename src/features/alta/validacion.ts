export interface DatosAlta {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
}

export type ErroresAlta = Partial<Record<keyof DatosAlta, string>>;

export const DATOS_ALTA_VACIOS: DatosAlta = { nombre: '', apellido: '', email: '', telefono: '' };

/**
 * Validación deliberadamente laxa: un email "correcto" según la RFC igual puede
 * no existir. Lo único que se atrapa acá son los errores de tipeo evidentes.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const MINIMO_DIGITOS_TELEFONO = 8;

export function validarEmail(email: string): string | undefined {
  const valor = email.trim();
  if (valor === '') return 'Ingresá tu email';
  if (!EMAIL.test(valor)) return 'Revisá el email: falta el @ o el dominio';
  return undefined;
}

export function validarAlta(datos: DatosAlta): ErroresAlta {
  const errores: ErroresAlta = {};

  if (datos.nombre.trim().length < 2) errores.nombre = 'Ingresá tu nombre';
  if (datos.apellido.trim().length < 2) errores.apellido = 'Ingresá tu apellido';

  const email = validarEmail(datos.email);
  if (email !== undefined) errores.email = email;

  if (datos.telefono.replace(/\D/g, '').length < MINIMO_DIGITOS_TELEFONO) {
    errores.telefono = `Ingresá un teléfono de al menos ${MINIMO_DIGITOS_TELEFONO} dígitos`;
  }

  return errores;
}

export function hayErrores(errores: ErroresAlta): boolean {
  return Object.keys(errores).length > 0;
}
