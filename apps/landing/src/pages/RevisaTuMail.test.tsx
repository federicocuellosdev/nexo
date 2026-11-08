import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rutas } from '@/router';
import { guardarHandoff } from '@/lib/handoff';

function montar() {
  const router = createMemoryRouter(rutas, { initialEntries: ['/revisa-tu-mail'] });
  return render(<RouterProvider router={router} />);
}

test('muestra el email al que se envió el enlace', () => {
  guardarHandoff({
    intent: 'alta',
    tipo: 'plan',
    id: 'nexo-2',
    usuario: {
      nombre: 'Camila',
      apellido: 'Pérez',
      email: 'camila.perez@ejemplo.com',
      dni: '34567890',
    },
  });
  montar();
  expect(screen.getByText('camila.perez@ejemplo.com')).toBeInTheDocument();
});

test('reenviar muestra un aviso sin recargar la pantalla', async () => {
  const usuario = userEvent.setup();
  guardarHandoff({ intent: 'login', email: 'camila.perez@ejemplo.com' });
  montar();
  await usuario.click(screen.getByRole('button', { name: 'Reenviar' }));
  expect(screen.getByRole('status')).toHaveTextContent('Te reenviamos el enlace');
});

test('sin handoff guardado ofrece volver al catálogo en vez de romper', () => {
  montar();
  expect(screen.getByRole('heading', { name: 'No hay una solicitud en curso' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Ver el catálogo' })).toHaveAttribute('href', '/catalogo');
});
