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
  // Acotado a `main`: el nombre también aparece en el bloque de identidad del
  // Sidebar, que está fuera de la pantalla. Buscarlo en todo el documento
  // encontraba dos y fallaba por ambigüedad, no porque la pantalla estuviera
  // mal. Así el test verifica lo que dice verificar: los datos EN /cuenta.
  const pantalla = within(screen.getByRole('main'));
  expect(pantalla.getByText('Camila Pérez')).toBeInTheDocument();
  expect(pantalla.getByText('camila.perez@ejemplo.com')).toBeInTheDocument();
  expect(pantalla.getByText('3415551234')).toBeInTheDocument();
});

test('muestra el domicilio cargado en el perfil', () => {
  seedDemo('activo');
  montar();
  expect(screen.getByText('Córdoba 1234, 3 B · Rosario, Santa Fe (2000)')).toBeInTheDocument();
});

test('editar el domicilio abre el wizard en la sección de Domicilio, sin los otros pasos', async () => {
  const usuario = userEvent.setup();
  seedDemo('activo');
  montar();

  const seccion = screen.getByRole('region', { name: 'Domicilio' });
  await usuario.click(within(seccion).getByRole('button', { name: 'Editar' }));

  const dialogo = screen.getByRole('dialog', { name: 'Editar tus datos' });
  expect(within(dialogo).getByLabelText(/^Localidad/)).toHaveValue('Rosario');
  // Edición de sección puntual: sin navegación a otros pasos.
  expect(within(dialogo).queryByRole('button', { name: 'Continuar' })).not.toBeInTheDocument();
  expect(within(dialogo).queryByRole('button', { name: 'Volver' })).not.toBeInTheDocument();
});

test('guardar el domicilio desde el diálogo actualiza el perfil en un solo clic', async () => {
  const usuario = userEvent.setup();
  seedDemo('activo');
  montar();

  const seccion = screen.getByRole('region', { name: 'Domicilio' });
  await usuario.click(within(seccion).getByRole('button', { name: 'Editar' }));

  const dialogo = screen.getByRole('dialog', { name: 'Editar tus datos' });
  await usuario.clear(within(dialogo).getByLabelText(/^Localidad/));
  await usuario.type(within(dialogo).getByLabelText(/^Localidad/), 'Funes');
  await usuario.click(within(dialogo).getByRole('button', { name: 'Guardar cambios' }));

  expect(getSession().perfil?.domicilio.localidad).toBe('Funes');
});

test('editar Documento (paso 1) desde /cuenta guarda en un solo clic', async () => {
  const usuario = userEvent.setup();
  seedDemo('activo');
  montar();

  const seccion = screen.getByRole('region', { name: 'Documento' });
  await usuario.click(within(seccion).getByRole('button', { name: 'Editar' }));

  const dialogo = screen.getByRole('dialog', { name: 'Editar tus datos' });
  await usuario.clear(within(dialogo).getByLabelText(/^Número de documento/));
  await usuario.type(within(dialogo).getByLabelText(/^Número de documento/), '40111222');
  expect(within(dialogo).queryByRole('button', { name: 'Continuar' })).not.toBeInTheDocument();
  await usuario.click(within(dialogo).getByRole('button', { name: 'Guardar cambios' }));

  expect(getSession().perfil?.numeroDocumento).toBe('40111222');
  expect(screen.queryByRole('dialog', { name: 'Editar tus datos' })).not.toBeInTheDocument();
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
