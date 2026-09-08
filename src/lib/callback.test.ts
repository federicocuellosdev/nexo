import { construirCallbackLogin, parsearCallback } from '@/lib/callback';

const ALTA =
  '?token=demo&intent=alta&tipo=plan&id=nexo-2' +
  '&nombre=Camila&apellido=P%C3%A9rez&email=camila.perez%40ejemplo.com&tel=3415551234';

test('parsea un alta completa', () => {
  expect(parsearCallback(ALTA)).toEqual({
    intent: 'alta',
    tipo: 'plan',
    id: 'nexo-2',
    usuario: {
      nombre: 'Camila',
      apellido: 'Pérez',
      email: 'camila.perez@ejemplo.com',
      telefono: '3415551234',
    },
  });
});

test('parsea un alta de producto', () => {
  expect(parsearCallback('?token=demo&intent=alta&tipo=producto&id=hogar-1&email=a%40b.com')).toEqual({
    intent: 'alta',
    tipo: 'producto',
    id: 'hogar-1',
    usuario: { nombre: '', apellido: '', email: 'a@b.com', telefono: '' },
  });
});

test('parsea un login', () => {
  expect(parsearCallback('?token=demo&intent=login&email=camila.perez%40ejemplo.com')).toEqual({
    intent: 'login',
    email: 'camila.perez@ejemplo.com',
  });
});

test('funciona con el search sin el signo de pregunta', () => {
  expect(parsearCallback('token=demo&intent=login&email=a%40b.com')).toEqual({
    intent: 'login',
    email: 'a@b.com',
  });
});

test('sin token válido devuelve null', () => {
  expect(parsearCallback('?intent=login&email=a%40b.com')).toBeNull();
  expect(parsearCallback('?token=otro&intent=login&email=a%40b.com')).toBeNull();
});

test('un intent desconocido devuelve null', () => {
  expect(parsearCallback('?token=demo&intent=borrar&email=a%40b.com')).toBeNull();
});

test('un login sin email devuelve null', () => {
  expect(parsearCallback('?token=demo&intent=login')).toBeNull();
});

test('un alta sin id devuelve null', () => {
  expect(parsearCallback('?token=demo&intent=alta&tipo=plan&email=a%40b.com')).toBeNull();
});

test('un alta con un tipo que no existe devuelve null', () => {
  expect(parsearCallback('?token=demo&intent=alta&tipo=servicio&id=x&email=a%40b.com')).toBeNull();
});

test('un alta sin email devuelve null', () => {
  expect(parsearCallback('?token=demo&intent=alta&tipo=plan&id=nexo-2')).toBeNull();
});

test('un query vacío devuelve null', () => {
  expect(parsearCallback('')).toBeNull();
});

test('construirCallbackLogin arma la ruta del mismo origen', () => {
  expect(construirCallbackLogin('camila.perez@ejemplo.com')).toBe(
    '/auth/callback?token=demo&intent=login&email=camila.perez%40ejemplo.com',
  );
});
