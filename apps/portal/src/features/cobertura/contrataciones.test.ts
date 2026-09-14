import {
  formatearFecha,
  planContratado,
  productosContratados,
  proximoVencimiento,
} from '@/features/cobertura/contrataciones';
import type { Orden, Session } from '@/mock/session';
import { USUARIO_DEMO } from '@/mock/usuarios';

const CUOTA_SETIEMBRE: Orden = {
  id: 'ord-2',
  fecha: '2026-09-01',
  tipo: 'plan',
  itemId: 'nexo-2',
  concepto: 'Nexo II · cuota mensual',
  monto: 12000,
  estado: 'pagada',
};

const CUOTA_AGOSTO: Orden = { ...CUOTA_SETIEMBRE, id: 'ord-1', fecha: '2026-08-01' };

const HOGAR: Orden = {
  id: 'ord-3',
  fecha: '2026-09-02',
  tipo: 'producto',
  itemId: 'hogar-1',
  concepto: 'Seguro de Hogar · hasta 1er piso · cuota mensual',
  monto: 19000,
  estado: 'pagada',
};

const BASE: Session = { usuario: USUARIO_DEMO, ordenes: [] };

test('sin órdenes pagadas no hay plan contratado', () => {
  expect(planContratado(BASE)).toBeUndefined();
});

test('una orden pendiente no cuenta como plan contratado', () => {
  const sesion: Session = { ...BASE, ordenes: [{ ...CUOTA_SETIEMBRE, estado: 'pendiente' }] };
  expect(planContratado(sesion)).toBeUndefined();
});

test('el plan contratado sale de la orden de plan pagada más reciente', () => {
  const sesion: Session = { ...BASE, ordenes: [CUOTA_AGOSTO, CUOTA_SETIEMBRE] };
  expect(planContratado(sesion)?.slug).toBe('nexo-2');
});

test('los productos contratados no se repiten aunque haya varias cuotas', () => {
  const sesion: Session = { ...BASE, ordenes: [HOGAR, { ...HOGAR, id: 'ord-4', fecha: '2026-08-02' }] };
  expect(productosContratados(sesion).map((p) => p.id)).toEqual(['hogar-1']);
});

test('formatearFecha pasa de ISO a día/mes/año sin depender del locale', () => {
  expect(formatearFecha('2026-09-01')).toBe('01/09/2026');
  expect(formatearFecha('2026-12-31')).toBe('31/12/2026');
});

test('el próximo vencimiento es un mes después de la última cuota pagada', () => {
  const sesion: Session = { ...BASE, ordenes: [CUOTA_AGOSTO, CUOTA_SETIEMBRE] };
  expect(proximoVencimiento(sesion)).toBe('01/10/2026');
});

test('el próximo vencimiento cruza bien el fin de año', () => {
  const sesion: Session = { ...BASE, ordenes: [{ ...CUOTA_SETIEMBRE, fecha: '2026-12-05' }] };
  expect(proximoVencimiento(sesion)).toBe('05/01/2027');
});

test('sin cuotas pagadas no hay próximo vencimiento', () => {
  expect(proximoVencimiento(BASE)).toBeUndefined();
});
