import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rutas } from '@/router';
import { resetSession } from '@/mock/session';

function montar() {
  const router = createMemoryRouter(rutas, { initialEntries: ['/ingresar'] });
  return render(<RouterProvider router={router} />);
}

beforeEach(() => {
  resetSession();
});

test('pide el email', () => {
  montar();
  expect(screen.getByLabelText('Email')).toBeInTheDocument();
});

test('un email vacío muestra el error y no avanza', async () => {
  const usuario = userEvent.setup();
  montar();
  await usuario.click(screen.getByRole('button', { name: 'Enviarme el enlace' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Ingresá tu email');
  expect(screen.queryByRole('heading', { name: 'Revisá tu mail' })).not.toBeInTheDocument();
});

test('un email mal escrito muestra el error de formato', async () => {
  const usuario = userEvent.setup();
  montar();
  await usuario.type(screen.getByLabelText('Email'), 'camila.ejemplo.com');
  await usuario.click(screen.getByRole('button', { name: 'Enviarme el enlace' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Revisá el email: falta el @ o el dominio');
});

test('un email válido muestra la pantalla de revisá tu mail con el enlace de login', async () => {
  const usuario = userEvent.setup();
  montar();
  await usuario.type(screen.getByLabelText('Email'), 'camila.perez@ejemplo.com');
  await usuario.click(screen.getByRole('button', { name: 'Enviarme el enlace' }));

  expect(screen.getByRole('heading', { name: 'Revisá tu mail' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Abrir el mail (demo)' })).toHaveAttribute(
    'href',
    '/auth/callback?token=demo&intent=login&email=camila.perez%40ejemplo.com',
  );
});
