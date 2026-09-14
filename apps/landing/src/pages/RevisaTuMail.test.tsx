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
    usuario: { nombre: 'Camila', apellido: 'Pérez', email: 'camila.perez@ejemplo.com', telefono: '3415551234' },
  });
  montar();
  expect(screen.getByText('camila.perez@ejemplo.com')).toBeInTheDocument();
});

test('el botón de la vista previa del mail apunta al callback del portal con todos los datos', () => {
  guardarHandoff({
    intent: 'alta',
    tipo: 'plan',
    id: 'nexo-2',
    usuario: { nombre: 'Camila', apellido: 'Pérez', email: 'camila.perez@ejemplo.com', telefono: '3415551234' },
  });
  montar();
  expect(screen.getByRole('link', { name: 'Abrir el mail (demo)' })).toHaveAttribute(
    'href',
    'http://localhost:5174/auth/callback?token=demo&intent=alta&tipo=plan&id=nexo-2' +
      '&nombre=Camila&apellido=P%C3%A9rez&email=camila.perez%40ejemplo.com&tel=3415551234',
  );
});

test('en modo login el enlace lleva intent=login', () => {
  guardarHandoff({ intent: 'login', email: 'camila.perez@ejemplo.com' });
  montar();
  expect(screen.getByRole('link', { name: 'Abrir el mail (demo)' })).toHaveAttribute(
    'href',
    'http://localhost:5174/auth/callback?token=demo&intent=login&email=camila.perez%40ejemplo.com',
  );
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
