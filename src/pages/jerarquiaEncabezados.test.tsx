import type { InitialEntry } from 'react-router';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen } from '@testing-library/react';
import { rutas } from '@/router';
import { resetSession, seedDemo, setSession } from '@/mock/session';
import { USUARIO_DEMO } from '@/mock/usuarios';

/**
 * Un solo lugar donde se verifica que ninguna pantalla del portal saltee
 * niveles de encabezado (WCAG 1.3.1 / técnica G141).
 *
 * Existe porque el patrón se rompió varias veces a mano: `EmptyState` traía un
 * `h3` fijo, así que los caminos vacíos de /coberturas, /pago e /inicio saltaban
 * de h1 a h3. Se arregló dándole a `EmptyState` la prop `como`, y este test es
 * lo que evita que vuelva.
 */
function montar(entrada: InitialEntry) {
  const router = createMemoryRouter(rutas, { initialEntries: [entrada] });
  return render(<RouterProvider router={router} />);
}

beforeEach(() => {
  resetSession();
});

/** Niveles de encabezado en orden de aparición en el documento. */
function niveles(): number[] {
  return screen
    .getAllByRole('heading')
    .map((h) => Number(h.tagName.slice(1)))
    .filter((n) => Number.isFinite(n));
}

function saltos(ns: number[]): string[] {
  const encontrados: string[] = [];
  for (let i = 1; i < ns.length; i += 1) {
    // Bajar de nivel es libre (de h3 se vuelve a h2); subir debe ser de a uno.
    if (ns[i] > ns[i - 1] + 1) encontrados.push(`h${ns[i - 1]} → h${ns[i]}`);
  }
  return encontrados;
}

test('la home arranca en h1 y no saltea niveles', () => {
  seedDemo('activo');
  montar('/inicio');
  expect(niveles()[0]).toBe(1);
  expect(saltos(niveles())).toEqual([]);
});

test('/inicio sin plan: el estado vacío no saltea de h1 a h3', () => {
  // Este era el caso roto: EmptyState traía h3 fijo y la sección "Tu cobertura"
  // no tiene encabezado visible, así que colgaba directo del saludo.
  setSession({ usuario: USUARIO_DEMO });
  montar('/inicio');
  expect(saltos(niveles())).toEqual([]);
});

test('/verificar con credencial válida no saltea niveles', () => {
  seedDemo('activo');
  montar('/verificar/1547');
  expect(niveles()[0]).toBe(1);
  expect(saltos(niveles())).toEqual([]);
});

test('/verificar sin resultado: el estado vacío no saltea de h1 a h3', () => {
  montar('/verificar/1547');
  expect(niveles()[0]).toBe(1);
  expect(saltos(niveles())).toEqual([]);
});

test('/coberturas sin coberturas no saltea niveles', () => {
  setSession({ usuario: USUARIO_DEMO });
  montar('/coberturas');
  expect(niveles()[0]).toBe(1);
  expect(saltos(niveles())).toEqual([]);
});

test('/coberturas con plan activo no saltea niveles', () => {
  seedDemo('activo');
  montar('/coberturas');
  expect(saltos(niveles())).toEqual([]);
});

test('/pago sin nada para pagar no saltea niveles', () => {
  setSession({ usuario: USUARIO_DEMO });
  montar('/pago');
  expect(niveles()[0]).toBe(1);
  expect(saltos(niveles())).toEqual([]);
});

test('/movimientos vacío conserva el h3 del estado vacío: cuelga de un h2 real', () => {
  // Acá el h3 SÍ es correcto y no había que tocarlo: el estado vacío vive
  // dentro de un panel que ya tiene su propio h2 (sr-only con el filtro).
  setSession({ usuario: USUARIO_DEMO });
  montar('/movimientos');
  expect(saltos(niveles())).toEqual([]);
});

test.each(['/inicio', '/planes', '/coberturas', '/movimientos', '/cuenta'])(
  '%s tiene exactamente un h1',
  (ruta) => {
    seedDemo('activo');
    montar(ruta);
    expect(niveles().filter((n) => n === 1)).toHaveLength(1);
  },
);
