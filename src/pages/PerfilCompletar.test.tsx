import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rutas } from '@/router';
import { getSession, resetSession, setSession } from '@/mock/session';
import { PERFIL_DEMO, USUARIO_DEMO } from '@/mock/usuarios';

function montar() {
  const router = createMemoryRouter(rutas, { initialEntries: ['/perfil/completar'] });
  return render(<RouterProvider router={router} />);
}

beforeEach(() => {
  resetSession();
});

test('muestra el wizard con su explicación', () => {
  setSession({ usuario: USUARIO_DEMO });
  montar();
  expect(screen.getByRole('heading', { level: 1, name: 'Completá tu perfil' })).toBeInTheDocument();
  expect(screen.getByText('Paso 1 de 4')).toBeInTheDocument();
});

test('al guardar deja el perfil en la sesión y lleva al inicio con el aviso', async () => {
  const usuario = userEvent.setup();
  setSession({ usuario: USUARIO_DEMO });
  montar();

  await usuario.type(screen.getByLabelText(/^Número de documento/), '35123456');
  await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
  await usuario.selectOptions(screen.getByLabelText(/^Sexo/), 'F');
  await usuario.type(screen.getByLabelText(/^Fecha de nacimiento/), '1990-04-17');
  await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
  await usuario.type(screen.getByLabelText(/^Calle/), 'Córdoba');
  await usuario.type(screen.getByLabelText(/^Número/), '1234');
  await usuario.type(screen.getByLabelText('Piso y departamento'), '3 B');
  await usuario.type(screen.getByLabelText(/^Localidad/), 'Rosario');
  await usuario.type(screen.getByLabelText(/^Provincia/), 'Santa Fe');
  await usuario.type(screen.getByLabelText(/^Código postal/), '2000');
  await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
  await usuario.selectOptions(screen.getByLabelText('¿Tenés obra social o prepaga?'), 'si');
  await usuario.type(screen.getByLabelText('¿Cuál?'), 'OSDE');
  await usuario.selectOptions(screen.getByLabelText(/^Tipo de contratación/), 'tomador-beneficiario');
  await usuario.click(screen.getByRole('button', { name: 'Guardar y activar' }));

  expect(getSession().perfil).toEqual(PERFIL_DEMO);
  // La navegación efectivamente llega a /inicio (y no al ErrorBoundary de
  // React Router, que quedaba silenciosamente mal hasta que la Task 15 creó
  // la ruta): se ve el saludo de Inicio y el aviso que llega por `state`.
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hola, Camila');
  expect(screen.getByRole('status')).toHaveTextContent('Cobertura activa');
});
