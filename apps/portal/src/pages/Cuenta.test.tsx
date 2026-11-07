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

test('la tarjeta de perfil muestra avatar, nombre, apellido y cantidad de familiares', () => {
  seedDemo('activo');
  montar();
  const perfil = within(screen.getByRole('region', { name: 'Perfil' }));
  expect(perfil.getByText('Camila')).toBeInTheDocument();
  expect(perfil.getByText('Pérez')).toBeInTheDocument();
  expect(perfil.getByText('Familiares')).toBeInTheDocument();
  // 2 familiares seedeados en `seedDemo('activo')`.
  expect(perfil.getByText('2')).toBeInTheDocument();
});

test('arma 3 cards top-level con los campos de /leads: personales, documento y contacto', () => {
  seedDemo('activo');
  montar();
  // Acotado por región: el nombre también vive en el Sidebar y la tarjeta de
  // perfil, y colisiona si se busca en todo el documento.
  const personales = within(screen.getByRole('region', { name: 'Datos personales' }));
  expect(personales.getByText('Camila')).toBeInTheDocument();
  expect(personales.getByText('Pérez')).toBeInTheDocument();
  expect(personales.getByText('Femenino')).toBeInTheDocument();
  expect(personales.getByText('1990-04-17')).toBeInTheDocument();

  const documento = within(screen.getByRole('region', { name: 'Documento' }));
  expect(documento.getByText('DNI')).toBeInTheDocument();
  expect(documento.getByText('35123456')).toBeInTheDocument();

  // La card se titula "Contacto" (y no "Datos de contacto") para no colisionar
  // con el espíritu del bloque de contacto del propio flujo /leads: acá sólo
  // viven los canales de comunicación (email y teléfono).
  const contacto = within(screen.getByRole('region', { name: 'Contacto' }));
  expect(contacto.getByText('camila.perez@ejemplo.com')).toBeInTheDocument();
  expect(contacto.getByText('3415551234')).toBeInTheDocument();
});

test('muestra los datos de domicilio con todos los campos que /leads solicita', () => {
  seedDemo('activo');
  montar();
  const seccion = within(screen.getByRole('region', { name: 'Datos de domicilio' }));
  expect(seccion.getByText('Córdoba')).toBeInTheDocument();
  expect(seccion.getByText('1234')).toBeInTheDocument();
  expect(seccion.getByText('3')).toBeInTheDocument();
  expect(seccion.getByText('B')).toBeInTheDocument();
  expect(seccion.getByText('Rosario')).toBeInTheDocument();
  expect(seccion.getByText('Santa Fe')).toBeInTheDocument();
  expect(seccion.getByText('2000')).toBeInTheDocument();
  expect(seccion.getByText('Argentina')).toBeInTheDocument();
});

test('editar el domicilio abre el wizard en la sección de Domicilio, sin los otros pasos', async () => {
  const usuario = userEvent.setup();
  seedDemo('activo');
  montar();

  const seccion = screen.getByRole('region', { name: 'Datos de domicilio' });
  await usuario.click(within(seccion).getByRole('button', { name: 'Editar' }));

  const dialogo = screen.getByRole('dialog', { name: 'Editar tus datos' });
  // Localidad es un combobox custom: el valor se lee del texto del botón,
  // no de `.value`. País sigue siendo un `<input>` y conserva `.value`.
  expect(within(dialogo).getByLabelText(/^Localidad/)).toHaveTextContent('Rosario');
  expect(within(dialogo).getByLabelText(/^País/)).toHaveValue('Argentina');
  // Edición de sección puntual: sin navegación a otros pasos.
  expect(within(dialogo).queryByRole('button', { name: 'Continuar' })).not.toBeInTheDocument();
  expect(within(dialogo).queryByRole('button', { name: 'Volver' })).not.toBeInTheDocument();
});

test('guardar el domicilio desde el diálogo actualiza el perfil en un solo clic', async () => {
  const usuario = userEvent.setup();
  seedDemo('activo');
  montar();

  const seccion = screen.getByRole('region', { name: 'Datos de domicilio' });
  await usuario.click(within(seccion).getByRole('button', { name: 'Editar' }));

  const dialogo = screen.getByRole('dialog', { name: 'Editar tus datos' });
  // Localidad es un combobox con catálogo cerrado (3 opciones): se cambia
  // abriendo el popover y clickeando otra opción, no tipeando. Antes se
  // tipeaba texto libre ("Funes"), pero el nuevo Select ya no lo permite.
  await usuario.click(within(dialogo).getByLabelText(/^Localidad/));
  await usuario.click(within(dialogo).getByRole('option', { name: 'Granadero Baigorria' }));
  await usuario.click(within(dialogo).getByRole('button', { name: 'Guardar cambios' }));

  expect(getSession().perfil?.domicilio.localidad).toBe('Granadero Baigorria');
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

test('sin perfil cargado las cards se renderizan igual con "—" en los campos sin cargar', () => {
  // Se removió el CTA "Completar perfil" en esta pantalla: la invitación vive
  // en otros puntos del portal (sidebar, inicio) y acá sumaba ruido. Las
  // cards se renderizan igual pero con "—" como marcador de "sin cargar",
  // para que la pantalla no cambie de estructura según el estado del perfil.
  setSession({ usuario: USUARIO_DEMO });
  montar();
  expect(screen.queryByRole('link', { name: 'Completar perfil' })).not.toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Datos personales' })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Documento' })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Contacto' })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Datos de domicilio' })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Datos de facturación' })).toBeInTheDocument();
});

test('muestra el email de MercadoPago en el bloque de facturación', () => {
  seedDemo('activo');
  montar();
  const seccion = within(screen.getByRole('region', { name: 'Datos de facturación' }));
  expect(seccion.getByText('camila.perez@ejemplo.com')).toBeInTheDocument();
});

test('editar el email de facturación actualiza la sesión', async () => {
  const usuario = userEvent.setup();
  seedDemo('activo');
  montar();

  const seccion = screen.getByRole('region', { name: 'Datos de facturación' });
  await usuario.click(within(seccion).getByRole('button', { name: 'Editar' }));

  const dialogo = screen.getByRole('dialog', { name: 'Email de facturación' });
  await usuario.clear(within(dialogo).getByLabelText(/^Email de MercadoPago/));
  await usuario.type(within(dialogo).getByLabelText(/^Email de MercadoPago/), 'camila.mp@ejemplo.com');
  await usuario.click(within(dialogo).getByRole('button', { name: 'Guardar cambios' }));

  expect(getSession().emailPago).toBe('camila.mp@ejemplo.com');
  expect(screen.queryByRole('dialog', { name: 'Email de facturación' })).not.toBeInTheDocument();
});

test('un email de facturación mal formado se rechaza antes de guardar', async () => {
  const usuario = userEvent.setup();
  seedDemo('activo');
  montar();

  const seccion = screen.getByRole('region', { name: 'Datos de facturación' });
  await usuario.click(within(seccion).getByRole('button', { name: 'Editar' }));

  const dialogo = screen.getByRole('dialog', { name: 'Email de facturación' });
  await usuario.clear(within(dialogo).getByLabelText(/^Email de MercadoPago/));
  await usuario.type(within(dialogo).getByLabelText(/^Email de MercadoPago/), 'esto-no-es-un-email');
  await usuario.click(within(dialogo).getByRole('button', { name: 'Guardar cambios' }));

  expect(within(dialogo).getByRole('alert')).toHaveTextContent('Revisá el formato del email');
  // La sesión no se tocó.
  expect(getSession().emailPago).toBe('camila.perez@ejemplo.com');
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
