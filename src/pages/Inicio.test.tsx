import type { InitialEntry } from 'react-router';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen } from '@testing-library/react';
import { rutas } from '@/router';
import { resetSession, seedDemo, setSession } from '@/mock/session';
import { USUARIO_DEMO } from '@/mock/usuarios';

function montar(entrada: InitialEntry = '/inicio') {
  const router = createMemoryRouter(rutas, { initialEntries: [entrada] });
  return render(<RouterProvider router={router} />);
}

beforeEach(() => {
  resetSession();
});

test('saluda por el nombre', () => {
  seedDemo('activo');
  montar();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hola, Camila');
});

test('muestra las novedades', () => {
  seedDemo('activo');
  montar();
  expect(screen.getByRole('list', { name: 'Novedades' })).toBeInTheDocument();
});

test('con cobertura activa muestra la tarjeta del plan', () => {
  seedDemo('activo');
  montar();
  expect(screen.getByText('Nexo II')).toBeInTheDocument();
  expect(screen.getByText('Activa')).toBeInTheDocument();
});

test('muestra los tres accesos rápidos', () => {
  seedDemo('activo');
  montar();
  expect(screen.getByRole('link', { name: 'Ver coberturas' })).toHaveAttribute('href', '/coberturas');
  expect(screen.getByRole('link', { name: 'Contratar producto' })).toHaveAttribute('href', '/planes');
  expect(screen.getByRole('link', { name: 'Mis movimientos' })).toHaveAttribute('href', '/movimientos');
});

test('lista como mucho los últimos tres movimientos', () => {
  seedDemo('activo');
  montar();
  const seccion = screen.getByRole('region', { name: 'Últimos movimientos' });
  expect(seccion.querySelectorAll('li').length).toBeLessThanOrEqual(3);
});

test('sin plan contratado invita a elegir uno', () => {
  setSession({ usuario: USUARIO_DEMO });
  montar();
  expect(screen.getByRole('heading', { name: 'Todavía no tenés un plan' })).toBeInTheDocument();
});

test('al venir de completar el perfil muestra el aviso de cobertura activa', () => {
  seedDemo('activo');
  montar({ pathname: '/inicio', state: { coberturaActivada: true } });
  expect(screen.getByRole('status')).toHaveTextContent('Cobertura activa');
});
