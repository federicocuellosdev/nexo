import {
  LARGO_NUMERO_FARMACIA,
  esNumeroDeAfiliado,
  numeroDeFarmacia,
  urlDeVerificacion,
} from '@/lib/credencial';

test('el ejemplo del spec: 1500 → 289000015000000', () => {
  expect(numeroDeFarmacia('1500')).toBe('289000015000000');
});

test('el número de farmacia siempre mide 15 caracteres', () => {
  for (const afiliado of ['1500', '1547', '9', '99999999']) {
    expect(numeroDeFarmacia(afiliado)).toHaveLength(LARGO_NUMERO_FARMACIA);
  }
});

test('mantiene el prefijo 289 y el sufijo 0000, sin importar el plan', () => {
  const numero = numeroDeFarmacia('1547');
  expect(numero?.startsWith('289')).toBe(true);
  expect(numero?.endsWith('0000')).toBe(true);
  // El tramo del medio son los 8 dígitos del afiliado con ceros a la izquierda.
  expect(numero?.slice(3, 11)).toBe('00001547');
});

test.each(['', 'N-1500', '1500 ', 'abc', '15.00', '-1'])(
  'rechaza %o como número de afiliado',
  (valor) => {
    expect(esNumeroDeAfiliado(valor)).toBe(false);
    expect(numeroDeFarmacia(valor)).toBeUndefined();
  },
);

test('con más de 8 dígitos devuelve undefined en vez de truncar como lpad', () => {
  // `lpad(x, 8, '0')` de Postgres TRUNCA por derecha y devolvería un número de
  // farmacia de otro afiliado. Preferimos no mostrar el bloque antes que
  // mostrar 15 dígitos que apuntan a la cuenta equivocada.
  expect(esNumeroDeAfiliado('123456789')).toBe(true);
  expect(numeroDeFarmacia('123456789')).toBeUndefined();
});

test('la URL de verificación no duplica la barra del origen', () => {
  expect(urlDeVerificacion('https://portal.nexo.ar', '1547')).toBe(
    'https://portal.nexo.ar/verificar/1547',
  );
  expect(urlDeVerificacion('https://portal.nexo.ar/', '1547')).toBe(
    'https://portal.nexo.ar/verificar/1547',
  );
});
