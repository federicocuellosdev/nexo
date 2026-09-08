import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen } from '@testing-library/react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { portalUrl } from '@/lib/urls';
import { ETIQUETA_MARCA } from '@/ui/LogoNexo';

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
  // Se deriva de `portalUrl()`, no se hardcodea el default de desarrollo:
  // `src/lib/urls.test.ts` ya cubre ese contrato por separado. Acá lo que
  // importa es la COMPOSICIÓN (`${portalUrl()}/ingresar`), no el valor.
  expect(screen.getByRole('link', { name: 'Ingresar' })).toHaveAttribute('href', `${portalUrl()}/ingresar`);
});

test('el pie aclara que es una maqueta de demostración', () => {
  montar();
  expect(screen.getByRole('contentinfo')).toHaveTextContent('Maqueta de demostración');
});

test('el logo de marca tiene nombre accesible en el header y en el pie', () => {
  montar();
  // El logo es una máscara CSS (`role="img"` en un `<span>`, no un `<img>`),
  // pero el nombre accesible vive en el `<Link>` que lo envuelve.
  expect(screen.getAllByRole('link', { name: ETIQUETA_MARCA })).toHaveLength(2);
});
