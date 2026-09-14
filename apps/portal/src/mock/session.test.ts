import {
  agregarOrden,
  CLAVE_SESION,
  getSession,
  resetSession,
  seedDemo,
  setSession,
  useSession,
  type Orden,
} from '@/mock/session';
import { PERFIL_DEMO, USUARIO_DEMO } from '@/mock/usuarios';
import { renderHook, act } from '@testing-library/react';

const ORDEN: Orden = {
  id: 'ord-1',
  fecha: '2026-09-05',
  tipo: 'plan',
  itemId: 'nexo-2',
  concepto: 'Nexo II · cuota mensual',
  monto: 12000,
  estado: 'pagada',
};

beforeEach(() => {
  resetSession();
});

test('la sesión arranca vacía con la lista de órdenes lista para usar', () => {
  expect(getSession()).toEqual({ ordenes: [] });
});

test('setSession aplica un parche sin pisar el resto', () => {
  setSession({ usuario: USUARIO_DEMO });
  setSession({ intent: { tipo: 'plan', id: 'nexo-2' } });

  const sesion = getSession();
  expect(sesion.usuario).toEqual(USUARIO_DEMO);
  expect(sesion.intent).toEqual({ tipo: 'plan', id: 'nexo-2' });
});

test('setSession persiste en localStorage bajo la clave del spec', () => {
  setSession({ usuario: USUARIO_DEMO });
  const guardado: unknown = JSON.parse(localStorage.getItem(CLAVE_SESION) ?? 'null');
  expect(guardado).toMatchObject({ usuario: USUARIO_DEMO, ordenes: [] });
});

test('resetSession vacía la sesión y el localStorage', () => {
  setSession({ usuario: USUARIO_DEMO });
  resetSession();
  expect(getSession()).toEqual({ ordenes: [] });
  expect(localStorage.getItem(CLAVE_SESION)).toBeNull();
});

test('agregarOrden pone la orden nueva primero', () => {
  agregarOrden(ORDEN);
  agregarOrden({ ...ORDEN, id: 'ord-2' });
  expect(getSession().ordenes.map((o) => o.id)).toEqual(['ord-2', 'ord-1']);
});

test('seedDemo nuevo-con-intent deja usuario e intención pero ningún pago', () => {
  seedDemo('nuevo-con-intent');
  const sesion = getSession();
  expect(sesion.usuario).toEqual(USUARIO_DEMO);
  expect(sesion.intent).toEqual({ tipo: 'plan', id: 'nexo-2' });
  expect(sesion.perfil).toBeUndefined();
  expect(sesion.ordenes).toEqual([]);
});

test('seedDemo activo deja perfil completo y al menos una orden pagada', () => {
  seedDemo('activo');
  const sesion = getSession();
  expect(sesion.perfil).toEqual(PERFIL_DEMO);
  expect(sesion.ordenes.some((o) => o.estado === 'pagada')).toBe(true);
});

test('useSession se vuelve a renderizar cuando cambia la sesión', () => {
  const { result } = renderHook(() => useSession());
  expect(result.current.usuario).toBeUndefined();

  act(() => {
    setSession({ usuario: USUARIO_DEMO });
  });

  expect(result.current.usuario).toEqual(USUARIO_DEMO);
});

test('la sesión se rehidrata desde localStorage al cargar el módulo', async () => {
  localStorage.setItem(
    CLAVE_SESION,
    JSON.stringify({ usuario: USUARIO_DEMO, ordenes: [ORDEN] }),
  );
  vi.resetModules();
  const modulo = await import('@/mock/session');
  expect(modulo.getSession().usuario).toEqual(USUARIO_DEMO);
  expect(modulo.getSession().ordenes).toHaveLength(1);
});

test('un localStorage corrupto no rompe la carga', async () => {
  localStorage.setItem(CLAVE_SESION, '{no es json');
  vi.resetModules();
  const modulo = await import('@/mock/session');
  expect(modulo.getSession()).toEqual({ ordenes: [] });
});

test('una sesión guardada sin ordenes se normaliza a lista vacía', async () => {
  localStorage.setItem(CLAVE_SESION, JSON.stringify({ usuario: USUARIO_DEMO }));
  vi.resetModules();
  const modulo = await import('@/mock/session');
  expect(modulo.getSession().ordenes).toEqual([]);
});

test('mutar el arreglo de órdenes de un snapshot vacío no corrompe futuros resets', () => {
  const sesion = getSession();
  sesion.ordenes.push(ORDEN);

  resetSession();

  expect(getSession().ordenes).toEqual([]);
});

test('getSession devuelve la misma referencia sin escrituras y una nueva tras setSession', () => {
  const primera = getSession();
  const segunda = getSession();
  expect(segunda).toBe(primera);

  setSession({ usuario: USUARIO_DEMO });
  const tercera = getSession();
  expect(tercera).not.toBe(segunda);
});
