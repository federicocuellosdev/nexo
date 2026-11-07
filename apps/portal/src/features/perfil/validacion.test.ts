import {
  aPerfil,
  BORRADOR_INICIAL,
  desdePerfil,
  identidadDelBorrador,
  validarPaso,
  type BorradorPerfil,
} from '@/features/perfil/validacion';
import { PERFIL_DEMO } from '@/mock/usuarios';

const HOY = new Date('2026-09-07T12:00:00Z');

const COMPLETO: BorradorPerfil = {
  nombre: 'Camila',
  apellido: 'Pérez',
  tipoDocumento: 'DNI',
  numeroDocumento: '35123456',
  sexo: 'F',
  fechaNacimiento: '1990-04-17',
  calle: 'Córdoba',
  numero: '1234',
  piso: '3',
  departamento: 'B',
  torre: '',
  localidad: 'Rosario',
  provincia: 'Santa Fe',
  cp: '2000',
  pais: 'Argentina',
  tieneObraSocial: 'si',
  obraSocial: 'OSDE',
  tipoContratacion: 'tomador-beneficiario',
};

test('el borrador inicial no pasa los pasos 1 a 3; el 4 ya no bloquea', () => {
  expect(validarPaso(1, BORRADOR_INICIAL, HOY).numeroDocumento).toBe('Ingresá tu número de documento');
  expect(validarPaso(2, BORRADOR_INICIAL, HOY).sexo).toBe('Elegí una opción');
  expect(validarPaso(3, BORRADOR_INICIAL, HOY).calle).toBe('Ingresá la calle');
  // El paso 4 dejó de pedir tipo de contratación: hoy queda fijado en
  // "tomador-beneficiario" y la obra social sigue en debate. No bloquea nada.
  expect(validarPaso(4, BORRADOR_INICIAL, HOY)).toEqual({});
});

test('el borrador completo pasa los cuatro pasos', () => {
  for (const paso of [1, 2, 3, 4] as const) {
    expect(validarPaso(paso, COMPLETO, HOY)).toEqual({});
  }
});

test('un DNI con letras o de largo inválido se rechaza', () => {
  expect(validarPaso(1, { ...COMPLETO, numeroDocumento: '35.123.456' }, HOY).numeroDocumento).toBe(
    'El DNI son 7 u 8 dígitos, sin puntos',
  );
  expect(validarPaso(1, { ...COMPLETO, numeroDocumento: '123' }, HOY).numeroDocumento).toBe(
    'El DNI son 7 u 8 dígitos, sin puntos',
  );
});

test('un pasaporte acepta letras pero pide al menos seis caracteres', () => {
  const conPasaporte: BorradorPerfil = { ...COMPLETO, tipoDocumento: 'Pasaporte' };
  expect(validarPaso(1, { ...conPasaporte, numeroDocumento: 'AA123456' }, HOY)).toEqual({});
  expect(validarPaso(1, { ...conPasaporte, numeroDocumento: 'AA12' }, HOY).numeroDocumento).toBe(
    'El pasaporte tiene al menos 6 caracteres',
  );
});

test('una fecha de nacimiento futura se rechaza', () => {
  expect(validarPaso(2, { ...COMPLETO, fechaNacimiento: '2030-01-01' }, HOY).fechaNacimiento).toBe(
    'Revisá la fecha: todavía no llegó',
  );
});

test('un menor de edad se rechaza porque Previnca no vende a menores', () => {
  expect(validarPaso(2, { ...COMPLETO, fechaNacimiento: '2010-09-08' }, HOY).fechaNacimiento).toBe(
    'Tenés que ser mayor de 18 años',
  );
});

test('faltar un día para los 18 años todavía rechaza', () => {
  // 2008-09-08 cumple 18 recién mañana (HOY = 2026-09-07): tiene 17 años y 364 días.
  expect(validarPaso(2, { ...COMPLETO, fechaNacimiento: '2008-09-08' }, HOY).fechaNacimiento).toBe(
    'Tenés que ser mayor de 18 años',
  );
});

test('cumplir 18 justo hoy alcanza', () => {
  expect(validarPaso(2, { ...COMPLETO, fechaNacimiento: '2008-09-07' }, HOY).fechaNacimiento).toBeUndefined();
});

test('el código postal son cuatro dígitos', () => {
  expect(validarPaso(3, { ...COMPLETO, cp: '200' }, HOY).cp).toBe('El código postal son 4 dígitos');
});

test('el código postal no acepta letras', () => {
  expect(validarPaso(3, { ...COMPLETO, cp: 'AB12' }, HOY).cp).toBe('El código postal son 4 dígitos');
});

test('el piso es opcional', () => {
  expect(validarPaso(3, { ...COMPLETO, piso: '' }, HOY)).toEqual({});
});

test('departamento y torre son opcionales: no todos los domicilios los tienen', () => {
  expect(validarPaso(3, { ...COMPLETO, departamento: '', torre: '' }, HOY)).toEqual({});
});

test('el país es obligatorio: /leads lo pide y Previnca lo necesita para facturar', () => {
  expect(validarPaso(3, { ...COMPLETO, pais: '' }, HOY).pais).toBe('Ingresá el país');
});

test('aPerfil omite departamento y torre vacíos en vez de guardar cadenas vacías', () => {
  const perfil = aPerfil({ ...COMPLETO, departamento: '  ', torre: '' });
  expect(perfil.domicilio.departamento).toBeUndefined();
  expect(perfil.domicilio.torre).toBeUndefined();
});

test('la obra social no bloquea el avance: está en debate', () => {
  expect(validarPaso(4, { ...COMPLETO, tieneObraSocial: '', obraSocial: '' }, HOY)).toEqual({});
});

test('aPerfil arma el perfil del spec §5', () => {
  expect(aPerfil(COMPLETO)).toEqual(PERFIL_DEMO);
});

test('aPerfil omite el piso vacío en vez de guardar una cadena vacía', () => {
  const perfil = aPerfil({ ...COMPLETO, piso: '  ' });
  expect(perfil.domicilio.piso).toBeUndefined();
});

test('aPerfil sin obra social no guarda el nombre de la obra social', () => {
  const perfil = aPerfil({ ...COMPLETO, tieneObraSocial: 'no', obraSocial: 'OSDE' });
  expect(perfil.tieneObraSocial).toBe(false);
  expect(perfil.obraSocial).toBeUndefined();
});

test('aPerfil falla ruidosamente con un borrador incompleto', () => {
  expect(() => aPerfil(BORRADOR_INICIAL)).toThrow('El borrador del perfil está incompleto');
});

test('desdePerfil y aPerfil son inversas', () => {
  expect(aPerfil(desdePerfil(PERFIL_DEMO))).toEqual(PERFIL_DEMO);
});

/* ── Nombre y apellido (paso 2) ──────────────────────────────────────────── */

test('el paso 2 NO pide nombre ni apellido: ya se cargan en el alta de la landing', () => {
  // El AltaDialog pide nombre/apellido antes del magic link. El wizard de
  // perfil sólo exige sexo y fecha; nombre/apellido vacíos no bloquean.
  expect(validarPaso(2, { ...COMPLETO, nombre: '', apellido: '' }, HOY)).toEqual({});
});

test('identidadDelBorrador recorta los espacios', () => {
  expect(identidadDelBorrador({ ...COMPLETO, nombre: '  Camila ', apellido: ' Pérez  ' })).toEqual({
    nombre: 'Camila',
    apellido: 'Pérez',
  });
});

test('aPerfil NO mete el nombre dentro del perfil: ese dato vive en el usuario', () => {
  // Es la garantía de que no se duplica la fuente de verdad. Si el nombre
  // entrara acá, habría dos lugares donde corregirlo y uno quedaría viejo.
  const perfil = aPerfil(COMPLETO) as unknown as Record<string, unknown>;
  expect(perfil.nombre).toBeUndefined();
  expect(perfil.apellido).toBeUndefined();
});

test('desdePerfil acepta la identidad para precargar el wizard desde /cuenta', () => {
  const borrador = desdePerfil(PERFIL_DEMO, { nombre: 'Camila', apellido: 'Pérez' });
  expect(borrador.nombre).toBe('Camila');
  expect(borrador.apellido).toBe('Pérez');
});

test('desdePerfil sin identidad deja los campos vacíos para que el paso 2 los pida', () => {
  const borrador = desdePerfil(PERFIL_DEMO);
  expect(borrador.nombre).toBe('');
  expect(borrador.apellido).toBe('');
});
