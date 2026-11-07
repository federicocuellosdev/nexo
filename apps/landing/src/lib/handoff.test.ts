import {
  borrarHandoff,
  CLAVE_HANDOFF,
  construirUrlCallback,
  guardarHandoff,
  leerHandoff,
  type Handoff,
} from '@/lib/handoff';

const ALTA: Handoff = {
  intent: 'alta',
  tipo: 'plan',
  id: 'nexo-2',
  usuario: {
    nombre: 'Camila',
    apellido: 'Pérez',
    email: 'camila.perez@ejemplo.com',
    dni: '34567890',
  },
};

test('la URL de alta lleva todos los parámetros del spec §4, en orden', () => {
  expect(construirUrlCallback(ALTA)).toBe(
    'http://localhost:5174/auth/callback?token=demo&intent=alta&tipo=plan&id=nexo-2' +
      '&nombre=Camila&apellido=P%C3%A9rez&email=camila.perez%40ejemplo.com&dni=34567890',
  );
});

test('la URL de login lleva solo token, intent y email', () => {
  expect(construirUrlCallback({ intent: 'login', email: 'camila.perez@ejemplo.com' })).toBe(
    'http://localhost:5174/auth/callback?token=demo&intent=login&email=camila.perez%40ejemplo.com',
  );
});

test('respeta una base explícita y le saca la barra final', () => {
  expect(construirUrlCallback({ intent: 'login', email: 'a@b.com' }, 'https://portal.nexo.test/')).toBe(
    'https://portal.nexo.test/auth/callback?token=demo&intent=login&email=a%40b.com',
  );
});

test('guardar y leer devuelve el mismo handoff', () => {
  guardarHandoff(ALTA);
  expect(leerHandoff()).toEqual(ALTA);
});

test('sin nada guardado devuelve null', () => {
  expect(leerHandoff()).toBeNull();
});

test('un JSON corrupto devuelve null en vez de romper la pantalla', () => {
  sessionStorage.setItem(CLAVE_HANDOFF, '{no es json');
  expect(leerHandoff()).toBeNull();
});

test('un objeto sin intent conocido devuelve null', () => {
  sessionStorage.setItem(CLAVE_HANDOFF, JSON.stringify({ intent: 'otra-cosa' }));
  expect(leerHandoff()).toBeNull();
});

test('borrarHandoff limpia el sessionStorage', () => {
  guardarHandoff(ALTA);
  borrarHandoff();
  expect(sessionStorage.getItem(CLAVE_HANDOFF)).toBeNull();
});
