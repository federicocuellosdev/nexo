import { buscarPlan, buscarProducto, ON_DEMAND, PLANES } from '@/mock/planes';
import { precioDesde } from '@/lib/formato';

test('hay exactamente tres planes, en orden de precio descendente', () => {
  expect(PLANES.map((p) => p.slug)).toEqual(['nexo-1', 'nexo-2', 'nexo-3']);
});

test('los precios son los del documento de producto', () => {
  expect(PLANES.map((p) => p.precio)).toEqual([20000, 12000, 7000]);
});

test('los nombres comerciales son los acordados con Previnca', () => {
  expect(PLANES.map((p) => p.nombre)).toEqual(['Nexo I', 'Nexo II', 'Nexo III']);
});

test('Nexo I es el plan recomendado y es el único', () => {
  expect(PLANES.filter((p) => p.recomendado === true).map((p) => p.slug)).toEqual(['nexo-1']);
});

test('el precio de entrada se deriva de los planes y hoy es 7000', () => {
  expect(precioDesde(PLANES)).toBe(7000);
});

test('hay cinco servicios on demand', () => {
  expect(ON_DEMAND).toHaveLength(5);
  expect(ON_DEMAND.map((p) => p.id)).toEqual(['salud-1', 'arbol-de-vida', 'hogar-1', 'hogar-2', 'vida']);
});

test('los cuatro datos sin confirmar quedan marcados con pendiente', () => {
  const prestacionesPendientes = PLANES.flatMap((plan) =>
    plan.prestaciones.filter((p) => p.pendiente === true).map((p) => `${plan.slug}:${p.label}`),
  );
  expect(prestacionesPendientes).toEqual(['nexo-1:Óptica', 'nexo-2:Médico a domicilio']);

  const productosPendientes = ON_DEMAND.filter((p) => p.pendiente === true).map((p) => p.id);
  expect(productosPendientes).toEqual(['arbol-de-vida', 'vida']);
});

test('`no-incluido` es un estado explícito, no una ausencia', () => {
  const nexo3 = buscarPlan('nexo-3');
  expect(nexo3?.prestaciones.filter((p) => p.estado === 'no-incluido').map((p) => p.label)).toEqual([
    'Emergencias médicas',
    'Guardia odontológica',
    'Farmacia',
  ]);
});

test('buscarPlan devuelve undefined para un slug desconocido', () => {
  expect(buscarPlan('nexo-9')).toBeUndefined();
});

test('buscarProducto encuentra por id', () => {
  expect(buscarProducto('hogar-2')?.precio).toBe(22000);
});
