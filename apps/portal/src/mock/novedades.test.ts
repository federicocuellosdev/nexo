import { NOVEDADES } from '@/mock/novedades';

test('hay tres novedades de demostración', () => {
  expect(NOVEDADES).toHaveLength(3);
});

test('cada novedad tiene id único, título y texto', () => {
  expect(new Set(NOVEDADES.map((n) => n.id)).size).toBe(3);
  for (const novedad of NOVEDADES) {
    expect(novedad.titulo.length).toBeGreaterThan(0);
    expect(novedad.texto.length).toBeGreaterThan(0);
  }
});
