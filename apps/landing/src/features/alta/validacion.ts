/**
 * Alta de la landing v3: campos mínimos para obtener el `sfLeadId` desde
 * SF /leads (nombre + apellido + DNI) + email para mandar el magic link.
 *
 * El resto de datos (teléfono, fecha de nacimiento, domicilio, CP) se
 * completa después, dentro del portal, para alimentar el /enrich de SF
 * y pasar el Prospect a `readyToSell: true`.
 */
export interface DatosAlta {
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
}

export type ErroresAlta = Partial<Record<keyof DatosAlta, string>>;

export const DATOS_ALTA_VACIOS: DatosAlta = { nombre: '', apellido: '', email: '', dni: '' };

/**
 * Validación deliberadamente laxa: un email "correcto" según la RFC igual puede
 * no existir. Lo único que se atrapa acá son los errores de tipeo evidentes.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DNI = /^\d{7,8}$/;

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

  if (!DNI.test(datos.dni.trim())) errores.dni = 'DNI de 7 u 8 dígitos';

  return errores;
}

export function hayErrores(errores: ErroresAlta): boolean {
  return Object.keys(errores).length > 0;
}
