import { iniciales, nombreVisible, saludo } from '@/lib/identidad';
import type { Usuario } from '@/mock/session';

const CAMILA: Usuario = {
  nombre: 'Camila',
  apellido: 'Pérez',
  email: 'camila.perez@ejemplo.com',
  telefono: '3415551234',
};

/** El que deja el login por "Ya tengo cuenta": sólo email. */
const SOLO_EMAIL: Usuario = { nombre: '', apellido: '', email: 'matias@gmail.com', telefono: '' };

test('saluda con el nombre cuando lo hay', () => {
  expect(saludo(CAMILA)).toBe('Hola, Camila');
});

test('sin nombre saluda sin la coma huérfana', () => {
  // El bug original: `Hola, ${usuario?.nombre ?? ''}` daba "Hola, " porque el
  // valor es cadena vacía, no undefined, así que `??` nunca dispara.
  expect(saludo(SOLO_EMAIL)).toBe('Hola');
  expect(saludo(undefined)).toBe('Hola');
});

test('un nombre con sólo espacios cuenta como vacío', () => {
  expect(saludo({ ...CAMILA, nombre: '   ' })).toBe('Hola');
});

test('las iniciales salen del nombre y el apellido', () => {
  expect(iniciales(CAMILA)).toBe('CP');
});

test('sin nombre las iniciales caen al email', () => {
  // Un círculo de color vacío no se lee como avatar, se lee como error de carga.
  expect(iniciales(SOLO_EMAIL)).toBe('M');
});

test('sin nombre ni email las iniciales son un guion, nunca vacío', () => {
  expect(iniciales({ nombre: '', apellido: '', email: '', telefono: '' })).toBe('—');
  expect(iniciales(undefined)).toBe('—');
});

test('el nombre visible cae al email cuando no hay nombre cargado', () => {
  expect(nombreVisible(CAMILA)).toBe('Camila Pérez');
  expect(nombreVisible(SOLO_EMAIL)).toBe('matias@gmail.com');
});

test('con sólo nombre o sólo apellido no deja espacios colgando', () => {
  expect(nombreVisible({ ...CAMILA, apellido: '' })).toBe('Camila');
  expect(nombreVisible({ ...CAMILA, nombre: '' })).toBe('Pérez');
});
