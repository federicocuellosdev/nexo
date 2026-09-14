import { iconoDeProducto } from '@/features/planes/iconoProducto';
import { ON_DEMAND } from '@/mock/planes';

test('todos los productos on demand tienen ícono', () => {
  // Si Previnca agrega un producto y nadie le asigna ícono, su tarjeta queda
  // visiblemente distinta a las otras cuatro. El fallback silencioso existe
  // para que no rompa, pero este test avisa que hay que completarlo.
  const sinIcono = ON_DEMAND.filter((p) => iconoDeProducto(p.id) === undefined).map((p) => p.id);
  expect(sinIcono).toEqual([]);
});

test('cada producto tiene un ícono distinto: dos iguales no diferencian nada', () => {
  const iconos = ON_DEMAND.map((p) => iconoDeProducto(p.id));
  expect(new Set(iconos).size).toBe(ON_DEMAND.length);
});

test('un id desconocido devuelve undefined en vez de romper', () => {
  expect(iconoDeProducto('no-existe')).toBeUndefined();
});
