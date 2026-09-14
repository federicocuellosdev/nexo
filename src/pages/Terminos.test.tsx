import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen, within } from '@testing-library/react';
import { rutas } from '@/router';
import { anclaClausula, CLAUSULAS } from '@/mock/terminos';

/**
 * Escapa los metacaracteres para construir un RegExp desde un título.
 * "Servicios adicionales (on-demand)" trae paréntesis, que sin escapar se
 * interpretan como grupo de captura y no matchean nada.
 */
function comoRegExp(texto: string): RegExp {
  return new RegExp(texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

function montar(ruta = '/terminos') {
  const router = createMemoryRouter(rutas, { initialEntries: [ruta] });
  return render(<RouterProvider router={router} />);
}

test('la página tiene su h1', () => {
  montar();
  expect(screen.getByRole('heading', { level: 1, name: 'Términos y Condiciones' })).toBeInTheDocument();
});

test('muestra TODAS las cláusulas del documento', () => {
  // Un contrato incompleto es peor que no publicarlo: si alguien agrega una
  // cláusula al dato y se olvida de la página, este test lo agarra.
  montar();
  const principal = within(screen.getByRole('main'));
  for (const clausula of CLAUSULAS) {
    expect(principal.getByRole('heading', { level: 2, name: comoRegExp(clausula.titulo) })).toBeInTheDocument();
  }
});

test('el índice enlaza a cada cláusula y las anclas existen', () => {
  montar();
  const indice = screen.getByRole('navigation', { name: 'Índice' });
  for (const clausula of CLAUSULAS) {
    const ancla = anclaClausula(clausula.numero);
    const enlace = within(indice).getByRole('link', { name: comoRegExp(clausula.titulo) });
    expect(enlace).toHaveAttribute('href', `#${ancla}`);
    // El destino tiene que existir de verdad, no sólo el enlace.
    expect(document.getElementById(ancla)).not.toBeNull();
  }
});

test('respeta la numeración del original, que salta de la 16 a la 20', () => {
  // Renumerar un documento legal por prolijidad visual rompe las referencias
  // cruzadas y las citas externas. Si algún día Previnca aporta las cláusulas
  // 17 a 19, este test falla y obliga a revisar la decisión a conciencia.
  const numeros = CLAUSULAS.map((c) => c.numero);
  expect(numeros).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 20]);
});

test('ninguna cláusula queda vacía', () => {
  for (const clausula of CLAUSULAS) {
    expect(clausula.titulo.trim()).not.toBe('');
    expect(clausula.bloques.length).toBeGreaterThan(0);
    for (const bloque of clausula.bloques) {
      if (bloque.tipo === 'parrafo') {
        expect(bloque.texto.trim().length).toBeGreaterThan(40);
      } else {
        expect(bloque.items.length).toBeGreaterThan(0);
        for (const item of bloque.items) expect(item.texto.trim().length).toBeGreaterThan(40);
      }
    }
  }
});

test('conserva los datos que identifican legalmente a la empresa', () => {
  // El CUIT y la razón social son lo que hace identificable al obligado: si se
  // pierden en una edición, el documento deja de servir para lo que existe.
  montar();
  const principal = within(screen.getByRole('main'));
  expect(principal.getByText(/Previnca S\.A\. CUIT: 30-68914068-4/)).toBeInTheDocument();
  expect(principal.getByText(/Tribunales Provinciales de Rosario/)).toBeInTheDocument();
  expect(principal.getByText(/Ley N° 25\.326/)).toBeInTheDocument();
});

test('el pie del sitio enlaza a los términos', () => {
  montar('/');
  const pie = within(screen.getByRole('contentinfo'));
  expect(pie.getByRole('link', { name: 'Términos y Condiciones' })).toHaveAttribute('href', '/terminos');
});
