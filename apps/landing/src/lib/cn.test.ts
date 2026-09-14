import { cn } from '@/lib/cn';

test('une las clases con un espacio', () => {
  expect(cn('rounded-card', 'bg-white')).toBe('rounded-card bg-white');
});

test('descarta false, null, undefined y cadenas vacías', () => {
  expect(cn('base', false, null, undefined, '', 'activo')).toBe('base activo');
});

test('devuelve cadena vacía cuando no hay ninguna clase', () => {
  expect(cn(false, undefined)).toBe('');
});
