import { hayErrores, validarAlta, validarEmail, DATOS_ALTA_VACIOS } from '@/features/alta/validacion';

const VALIDOS = {
  nombre: 'Camila',
  apellido: 'Pérez',
  email: 'camila.perez@ejemplo.com',
  telefono: '3415551234',
  dni: '34567890',
};

test('los datos completos no producen errores', () => {
  expect(validarAlta(VALIDOS)).toEqual({});
  expect(hayErrores(validarAlta(VALIDOS))).toBe(false);
});

test('el formulario vacío marca los cinco campos requeridos', () => {
  const errores = validarAlta(DATOS_ALTA_VACIOS);
  expect(Object.keys(errores).sort()).toEqual(['apellido', 'dni', 'email', 'nombre', 'telefono']);
});

test('un nombre de una sola letra no alcanza', () => {
  expect(validarAlta({ ...VALIDOS, nombre: 'C' }).nombre).toBe('Ingresá tu nombre');
});

test('el nombre con espacios alrededor se considera vacío', () => {
  expect(validarAlta({ ...VALIDOS, nombre: '   ' }).nombre).toBe('Ingresá tu nombre');
});

test('un email sin arroba se rechaza', () => {
  expect(validarEmail('camila.ejemplo.com')).toBe('Revisá el email: falta el @ o el dominio');
});

test('un email sin dominio se rechaza', () => {
  expect(validarEmail('camila@ejemplo')).toBe('Revisá el email: falta el @ o el dominio');
});

test('un email vacío pide el dato en vez de hablar de formato', () => {
  expect(validarEmail('')).toBe('Ingresá tu email');
});

test('un email válido no devuelve error', () => {
  expect(validarEmail('camila.perez@ejemplo.com')).toBeUndefined();
});

test('el DNI debe tener 7 u 8 dígitos', () => {
  expect(validarAlta({ ...VALIDOS, dni: '34567890' }).dni).toBeUndefined();
  expect(validarAlta({ ...VALIDOS, dni: '1234567' }).dni).toBeUndefined();
  expect(validarAlta({ ...VALIDOS, dni: '12345' }).dni).toBe('DNI de 7 u 8 dígitos');
  expect(validarAlta({ ...VALIDOS, dni: 'abc12345' }).dni).toBe('DNI de 7 u 8 dígitos');
});
