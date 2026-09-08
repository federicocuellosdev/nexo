import { formatearMiles, formatearPrecio, partesMoneda, precioDesde } from '@/lib/formato';

test('formatearMiles separa de a tres dígitos con punto', () => {
  expect(formatearMiles(20000)).toBe('20.000');
  expect(formatearMiles(7000)).toBe('7.000');
  expect(formatearMiles(1234567)).toBe('1.234.567');
});

test('formatearMiles deja intactos los números de menos de cuatro dígitos', () => {
  expect(formatearMiles(0)).toBe('0');
  expect(formatearMiles(999)).toBe('999');
});

test('formatearMiles no depende del locale de la máquina', () => {
  // `toLocaleString` da '20,000' en en-US y '20.000' en es-AR: por eso el
  // separador se arma a mano y el resultado es idéntico en Node y en el browser.
  expect(formatearMiles(20000)).not.toContain(',');
});

test('formatearPrecio antepone el signo peso', () => {
  expect(formatearPrecio(12000)).toBe('$12.000');
});

test('partesMoneda separa entero y decimales para el superíndice', () => {
  expect(partesMoneda(20000)).toEqual({ entero: '20.000', decimales: '00' });
  expect(partesMoneda(2750.5)).toEqual({ entero: '2.750', decimales: '50' });
});

test('precioDesde devuelve el precio más bajo de la lista', () => {
  expect(precioDesde([{ precio: 20000 }, { precio: 12000 }, { precio: 7000 }])).toBe(7000);
});

test('precioDesde falla ruidosamente con una lista vacía', () => {
  expect(() => precioDesde([])).toThrow('precioDesde necesita al menos un ítem');
});
