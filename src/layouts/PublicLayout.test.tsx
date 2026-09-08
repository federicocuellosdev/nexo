import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen } from '@testing-library/react';
import { PublicLayout } from '@/layouts/PublicLayout';

function montar() {
  const router = createMemoryRouter(
    [{ path: '/', element: <PublicLayout />, children: [{ index: true, element: <p>contenido</p> }] }],
    { initialEntries: ['/'] },
  );
  return render(<RouterProvider router={router} />);
}

test('renderiza el contenido de la ruta hija', () => {
  montar();
  expect(screen.getByText('contenido')).toBeInTheDocument();
});

test('el botón Ingresar apunta al portal', () => {
  montar();
  expect(screen.getByRole('link', { name: 'Ingresar' })).toHaveAttribute(
    'href',
    'http://localhost:5174/ingresar',
  );
});

test('el pie aclara que es una maqueta de demostración', () => {
  montar();
  expect(screen.getByRole('contentinfo')).toHaveTextContent('Maqueta de demostración');
});
