import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rutas } from '@/router';
import { getSession, resetSession, seedDemo, setSession } from '@/mock/session';
import { USUARIO_DEMO } from '@/mock/usuarios';

function montar() {
  const router = createMemoryRouter(rutas, { initialEntries: ['/cuenta'] });
  return render(<RouterProvider router={router} />);
}

beforeEach(() => {
  resetSession();
});

test('muestra los datos del usuario base', () => {
  seedDemo('activo');
  montar();
  expect(screen.getByText('Camila Pérez')).toBeInTheDocument();
  expect(screen.getByText('camila.perez@ejemplo.com')).toBeInTheDocument();
  expect(screen.getByText('3415551234')).toBeInTheDocument();
});

test('muestra el domicilio cargado en el perfil', () => {
  seedDemo('activo');
  montar();
  expect(screen.getByText('Córdoba 1234, 3 B · Rosario, Santa Fe (2000)')).toBeInTheDocument();
});

test('editar el domicilio abre el wizard en el paso 3', async () => {
  const usuario = userEvent.setup();
  seedDemo('activo');
  montar();

  const seccion = screen.getByRole('region', { name: 'Domicilio' });
  await usuario.click(within(seccion).getByRole('button', { name: 'Editar' }));

  const dialogo = screen.getByRole('dialog', { name: 'Editar tus datos' });
  expect(within(dialogo).getByText('Paso 3 de 4')).toBeInTheDocument();
  expect(within(dialogo).getByLabelText(/^Localidad/)).toHaveValue('Rosario');
});

test('guardar desde el diálogo actualiza el perfil de la sesión', async () => {
  const usuario = userEvent.setup();
  seedDemo('activo');
  montar();

  const seccion = screen.getByRole('region', { name: 'Domicilio' });
  await usuario.click(within(seccion).getByRole('button', { name: 'Editar' }));

  const dialogo = screen.getByRole('dialog', { name: 'Editar tus datos' });
  await usuario.clear(within(dialogo).getByLabelText(/^Localidad/));
  await usuario.type(within(dialogo).getByLabelText(/^Localidad/), 'Funes');
  await usuario.click(within(dialogo).getByRole('button', { name: 'Continuar' }));
  await usuario.click(within(dialogo).getByRole('button', { name: 'Guardar y activar' }));

  expect(getSession().perfil?.domicilio.localidad).toBe('Funes');
});

test('sin perfil cargado invita a completarlo en vez de mostrar campos vacíos', () => {
  setSession({ usuario: USUARIO_DEMO });
  montar();
  expect(screen.getByRole('link', { name: 'Completar perfil' })).toHaveAttribute('href', '/perfil/completar');
});

test('muestra el medio de pago ficticio', () => {
  seedDemo('activo');
  montar();
  expect(screen.getByText(/•••• 4242/)).toBeInTheDocument();
});

test('las notificaciones son interruptores sin efecto, marcados como demo', () => {
  seedDemo('activo');
  montar();
  const seccion = screen.getByRole('region', { name: 'Notificaciones' });
  expect(within(seccion).getAllByRole('switch')).toHaveLength(2);
  expect(within(seccion).getByText('sin efecto · demo')).toBeInTheDocument();
});

test('cerrar sesión limpia la sesión y apunta a la landing', async () => {
  const usuario = userEvent.setup();
  seedDemo('activo');
  montar();

  const seccion = screen.getByRole('region', { name: 'Sesión' });
  const salir = within(seccion).getByRole('link', { name: 'Cerrar sesión' });
  expect(salir).toHaveAttribute('href', 'http://localhost:5173');
  await usuario.click(salir);
  expect(getSession().usuario).toBeUndefined();
});
