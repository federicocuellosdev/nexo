import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen } from '@testing-library/react';
import { rutas } from '@/router';
import { ETIQUETA_MARCA } from '@/ui/LogoNexo';

test('una ruta desconocida muestra la página 404 con marca, no el error genérico de React Router', () => {
  const router = createMemoryRouter(rutas, { initialEntries: ['/ruta-que-no-existe'] });
  render(<RouterProvider router={router} />);

  expect(screen.getByRole('heading', { name: 'Esta página no existe' })).toBeInTheDocument();
  // El TopBar de PublicLayout tiene que seguir ahí: la 404 no reemplaza toda
  // la página por un error sin estilo, conserva la marca.
  expect(screen.getAllByRole('link', { name: ETIQUETA_MARCA }).length).toBeGreaterThan(0);
  expect(document.body.textContent).not.toContain('Unexpected Application Error');
});
