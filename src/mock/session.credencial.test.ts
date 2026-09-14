import {
  CLAVE_CONTADOR,
  agregarOrden,
  getSession,
  resetSession,
  seedDemo,
  setSession,
  type Orden,
} from '@/mock/session';
import { PERFIL_DEMO, USUARIO_DEMO } from '@/mock/usuarios';
import { PRIMER_NUMERO_AFILIADO } from '@/lib/credencial';

const ORDEN_PAGADA: Orden = {
  id: 'ord-test',
  fecha: '2026-09-01',
  tipo: 'plan',
  itemId: 'nexo-2',
  concepto: 'Nexo II · cuota mensual',
  monto: 12000,
  estado: 'pagada',
};

beforeEach(() => {
  resetSession();
  // `resetSession` borra la sesión pero NO el contador, que es justamente lo
  // que se quiere en la maqueta. Acá sí hay que limpiarlo para que cada test
  // arranque de la misma serie.
  localStorage.removeItem(CLAVE_CONTADOR);
});

test('sin pago no hay número: nunca se asigna en pendiente', () => {
  setSession({ usuario: USUARIO_DEMO, intent: { tipo: 'plan', id: 'nexo-2' } });
  expect(getSession().numeroAfiliado).toBeUndefined();
});

test('pagado pero sin perfil tampoco tiene número', () => {
  setSession({ usuario: USUARIO_DEMO });
  agregarOrden(ORDEN_PAGADA);
  expect(getSession().numeroAfiliado).toBeUndefined();
});

test('se asigna al quedar activa, arrancando en 1500', () => {
  setSession({ usuario: USUARIO_DEMO });
  agregarOrden(ORDEN_PAGADA);
  setSession({ perfil: PERFIL_DEMO });
  expect(getSession().numeroAfiliado).toBe(String(PRIMER_NUMERO_AFILIADO));
});

test('no se regenera: escrituras posteriores conservan el número', () => {
  setSession({ usuario: USUARIO_DEMO, perfil: PERFIL_DEMO });
  agregarOrden(ORDEN_PAGADA);
  const asignado = getSession().numeroAfiliado;

  setSession({ usuario: { ...USUARIO_DEMO, telefono: '3410000000' } });
  agregarOrden({ ...ORDEN_PAGADA, id: 'ord-test-2', fecha: '2026-10-01' });

  expect(getSession().numeroAfiliado).toBe(asignado);
});

test('volver a pendiente y reactivarse conserva el número histórico', () => {
  setSession({ usuario: USUARIO_DEMO, perfil: PERFIL_DEMO });
  agregarOrden(ORDEN_PAGADA);
  const original = getSession().numeroAfiliado;

  // Equivalente en la maqueta de un `active → suspended → active` del 2.0.
  setSession({ perfil: undefined });
  setSession({ perfil: PERFIL_DEMO });

  expect(getSession().numeroAfiliado).toBe(original);
});

test('el correlativo avanza entre altas: 1500 y después 1501', () => {
  setSession({ usuario: USUARIO_DEMO, perfil: PERFIL_DEMO });
  agregarOrden(ORDEN_PAGADA);
  expect(getSession().numeroAfiliado).toBe('1500');

  // `resetSession` deja el contador intacto a propósito: recorrer el alta dos
  // veces tiene que mostrar que la serie avanza.
  resetSession();
  setSession({ usuario: USUARIO_DEMO, perfil: PERFIL_DEMO });
  agregarOrden(ORDEN_PAGADA);
  expect(getSession().numeroAfiliado).toBe('1501');
});

test('el preset de demo trae un número a mitad de la serie', () => {
  seedDemo('activo');
  expect(getSession().numeroAfiliado).toBe('1547');
});

test('el preset sin pago no tiene número', () => {
  seedDemo('nuevo-con-intent');
  expect(getSession().numeroAfiliado).toBeUndefined();
});
