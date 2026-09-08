import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AltaDialog, type ItemAlta } from '@/features/alta/AltaDialog';
import { leerHandoff } from '@/lib/handoff';

const ITEM: ItemAlta = { tipo: 'plan', id: 'nexo-2', nombre: 'Nexo II', precio: 12000 };

function montar() {
  const router = createMemoryRouter(
    [
      { path: '/', element: <AltaDialog abierto onCambio={() => {}} item={ITEM} /> },
      { path: '/revisa-tu-mail', element: <p>pantalla revisa tu mail</p> },
    ],
    { initialEntries: ['/'] },
  );
  return render(<RouterProvider router={router} />);
}

// Los cuatro campos son `requerido`, así que `Field` les agrega un asterisco
// visual (" *") dentro del propio <label>: el texto accesible real es
// "Nombre *", no "Nombre" (ver Field.test.tsx, que ya usa regex por lo mismo).
// Por eso se matchea con regex de inicio de cadena en vez de string exacto.
async function completarDatosValidos(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.type(screen.getByLabelText(/^Nombre/), 'Camila');
  await usuario.type(screen.getByLabelText(/^Apellido/), 'Pérez');
  await usuario.type(screen.getByLabelText(/^Email/), 'camila.perez@ejemplo.com');
  await usuario.type(screen.getByLabelText(/^Teléfono/), '3415551234');
}

test('muestra el resumen de lo que se está contratando', () => {
  montar();
  expect(screen.getByRole('dialog', { name: 'Contratar Nexo II' })).toBeInTheDocument();
  expect(screen.getByText('$12.000,00 por mes')).toBeInTheDocument();
  expect(screen.queryByText('a confirmar')).not.toBeInTheDocument();
});

test('un ítem pendiente muestra el chip "a confirmar" junto al precio', () => {
  const itemPendiente: ItemAlta = { ...ITEM, pendiente: true };
  const router = createMemoryRouter(
    [{ path: '/', element: <AltaDialog abierto onCambio={() => {}} item={itemPendiente} /> }],
    { initialEntries: ['/'] },
  );
  render(<RouterProvider router={router} />);
  expect(screen.getByText('a confirmar')).toBeInTheDocument();
});

test('el plan elegido viaja como campo oculto', () => {
  montar();
  // El Sheet se monta en un portal de Radix, FUERA del container de render:
  // hay que buscar dentro del diálogo, no en el contenedor.
  const dialogo = screen.getByRole('dialog', { name: 'Contratar Nexo II' });
  expect(dialogo.querySelector('input[type="hidden"][name="itemId"]')).toHaveValue('nexo-2');
  expect(dialogo.querySelector('input[type="hidden"][name="itemTipo"]')).toHaveValue('plan');
});

test('enviar vacío muestra los cuatro errores y no navega', async () => {
  const usuario = userEvent.setup();
  montar();
  await usuario.click(screen.getByRole('button', { name: 'Crear mi cuenta' }));
  expect(screen.getAllByRole('alert')).toHaveLength(4);
  expect(screen.queryByText('pantalla revisa tu mail')).not.toBeInTheDocument();
});

test('un email mal escrito muestra el error del email', async () => {
  const usuario = userEvent.setup();
  montar();
  await completarDatosValidos(usuario);
  await usuario.clear(screen.getByLabelText(/^Email/));
  await usuario.type(screen.getByLabelText(/^Email/), 'camila.ejemplo.com');
  await usuario.click(screen.getByRole('button', { name: 'Crear mi cuenta' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Revisá el email: falta el @ o el dominio');
});

test('el envío válido guarda el handoff de alta y navega a revisá tu mail', async () => {
  const usuario = userEvent.setup();
  montar();
  await completarDatosValidos(usuario);
  await usuario.click(screen.getByRole('button', { name: 'Crear mi cuenta' }));

  expect(screen.getByText('pantalla revisa tu mail')).toBeInTheDocument();
  expect(leerHandoff()).toEqual({
    intent: 'alta',
    tipo: 'plan',
    id: 'nexo-2',
    usuario: {
      nombre: 'Camila',
      apellido: 'Pérez',
      email: 'camila.perez@ejemplo.com',
      telefono: '3415551234',
    },
  });
});

test('"Ya tengo cuenta" deja solo el email', async () => {
  const usuario = userEvent.setup();
  montar();
  await usuario.click(screen.getByRole('button', { name: 'Ya tengo cuenta' }));
  expect(screen.getByLabelText(/^Email/)).toBeInTheDocument();
  expect(screen.queryByLabelText(/^Nombre/)).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/^Teléfono/)).not.toBeInTheDocument();
});

test('en modo login el envío válido guarda un handoff de login', async () => {
  const usuario = userEvent.setup();
  montar();
  await usuario.click(screen.getByRole('button', { name: 'Ya tengo cuenta' }));
  await usuario.type(screen.getByLabelText(/^Email/), 'camila.perez@ejemplo.com');
  await usuario.click(screen.getByRole('button', { name: 'Enviarme el enlace' }));

  expect(leerHandoff()).toEqual({ intent: 'login', email: 'camila.perez@ejemplo.com' });
});

test('volver a "Crear una cuenta" repone los campos', async () => {
  const usuario = userEvent.setup();
  montar();
  await usuario.click(screen.getByRole('button', { name: 'Ya tengo cuenta' }));
  await usuario.click(screen.getByRole('button', { name: 'Crear una cuenta' }));
  expect(screen.getByLabelText(/^Nombre/)).toBeInTheDocument();
});
