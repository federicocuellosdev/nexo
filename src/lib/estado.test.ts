import { coberturaActiva, derivarEstado } from '@/lib/estado';
import type { Orden, Session } from '@/mock/session';
import { PERFIL_DEMO, USUARIO_DEMO } from '@/mock/usuarios';

const PAGADA: Orden = {
  id: 'ord-1',
  fecha: '2026-09-01',
  tipo: 'plan',
  itemId: 'nexo-2',
  concepto: 'Nexo II · cuota mensual',
  monto: 12000,
  estado: 'pagada',
};

const PENDIENTE: Orden = { ...PAGADA, id: 'ord-2', estado: 'pendiente' };

test('sin usuario el estado es sinCuenta', () => {
  const sesion: Session = { ordenes: [] };
  expect(derivarEstado(sesion)).toBe('sinCuenta');
});

test('con usuario y sin ninguna orden pagada el estado es conCuentaSinPago', () => {
  const sesion: Session = { usuario: USUARIO_DEMO, ordenes: [] };
  expect(derivarEstado(sesion)).toBe('conCuentaSinPago');
});

test('una orden pendiente no cuenta como pago', () => {
  const sesion: Session = { usuario: USUARIO_DEMO, ordenes: [PENDIENTE] };
  expect(derivarEstado(sesion)).toBe('conCuentaSinPago');
});

test('con pago y sin perfil el estado es pagadoSinPerfil', () => {
  const sesion: Session = { usuario: USUARIO_DEMO, ordenes: [PAGADA] };
  expect(derivarEstado(sesion)).toBe('pagadoSinPerfil');
});

test('con pago y perfil el estado es activo', () => {
  const sesion: Session = { usuario: USUARIO_DEMO, perfil: PERFIL_DEMO, ordenes: [PAGADA] };
  expect(derivarEstado(sesion)).toBe('activo');
});

test('un perfil completo sin pago no activa la cobertura', () => {
  const sesion: Session = { usuario: USUARIO_DEMO, perfil: PERFIL_DEMO, ordenes: [] };
  expect(derivarEstado(sesion)).toBe('conCuentaSinPago');
  expect(coberturaActiva(sesion)).toBe(false);
});

test('coberturaActiva solo es verdadera en el estado activo', () => {
  expect(coberturaActiva({ usuario: USUARIO_DEMO, perfil: PERFIL_DEMO, ordenes: [PAGADA] })).toBe(true);
  expect(coberturaActiva({ usuario: USUARIO_DEMO, ordenes: [PAGADA] })).toBe(false);
});
