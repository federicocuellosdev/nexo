import type { Orden, Session } from '@/mock/session';
import { PERFIL_DEMO, USUARIO_DEMO } from '@/mock/usuarios';
import { credencialDeLaSesion } from '@/features/credencial/datos';

const ORDEN_PAGADA: Orden = {
  id: 'ord-1',
  fecha: '2026-09-01',
  tipo: 'plan',
  itemId: 'nexo-2',
  concepto: 'Nexo II · cuota mensual',
  monto: 12000,
  estado: 'pagada',
};

const ACTIVA: Session = {
  usuario: USUARIO_DEMO,
  perfil: PERFIL_DEMO,
  ordenes: [ORDEN_PAGADA],
  numeroAfiliado: '1547',
};

test('con la cobertura activa devuelve los datos completos', () => {
  expect(credencialDeLaSesion(ACTIVA)).toEqual({
    nombre: 'Camila Pérez',
    plan: 'Nexo II',
    numeroAfiliado: '1547',
    vigenteHasta: '01/10/2026',
  });
});

test('sin cuenta no hay credencial', () => {
  expect(credencialDeLaSesion({ ordenes: [] })).toBeUndefined();
});

test('con cuenta pero sin pago no hay credencial', () => {
  expect(credencialDeLaSesion({ usuario: USUARIO_DEMO, ordenes: [] })).toBeUndefined();
});

test('pagado pero sin perfil no hay credencial', () => {
  // Es el estado en el que la cobertura todavía no está activa: mostrar la
  // credencial sería invitar a presentarla en una farmacia que la va a rechazar.
  expect(
    credencialDeLaSesion({ usuario: USUARIO_DEMO, ordenes: [ORDEN_PAGADA] }),
  ).toBeUndefined();
});

test('activa pero sin número asignado no devuelve una credencial a medias', () => {
  expect(credencialDeLaSesion({ ...ACTIVA, numeroAfiliado: undefined })).toBeUndefined();
});

test('la vigencia sale del ciclo de pago, no de un campo aparte', () => {
  const conPagoPosterior = {
    ...ACTIVA,
    ordenes: [{ ...ORDEN_PAGADA, id: 'ord-2', fecha: '2026-10-01' }, ORDEN_PAGADA],
  };
  expect(credencialDeLaSesion(conPagoPosterior)?.vigenteHasta).toBe('01/11/2026');
});
