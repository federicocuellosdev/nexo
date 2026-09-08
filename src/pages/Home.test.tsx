import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen, within } from '@testing-library/react';
import { rutas } from '@/router';

function montarEn(ruta: string) {
  const router = createMemoryRouter(rutas, { initialEntries: [ruta] });
  return render(<RouterProvider router={router} />);
}

test('el hero muestra el precio de entrada derivado de los planes', () => {
  montarEn('/');
  expect(screen.getByText(/desde \$7\.000 por mes/i)).toBeInTheDocument();
});

test('el hero lleva al catálogo', () => {
  montarEn('/');
  expect(screen.getByRole('link', { name: 'Ver planes' })).toHaveAttribute('href', '/catalogo');
});

test('el segundo CTA del hero lleva a la pestaña de productos', () => {
  montarEn('/');
  expect(screen.getByRole('link', { name: 'Ver productos' })).toHaveAttribute('href', '/catalogo?tab=productos');
});

test('explica el alta en tres pasos', () => {
  montarEn('/');
  const seccion = screen.getByRole('region', { name: 'Cómo funciona' });
  // `getAllByRole` recorre el árbol de accesibilidad (lo que llega a un lector
  // de pantalla), no el DOM crudo: un paso con `aria-hidden` por error no
  // pasaría acá aunque siguiera siendo un `<li>` de verdad.
  expect(within(seccion).getAllByRole('listitem')).toHaveLength(3);
});

test('muestra las tres tarjetas de plan', () => {
  montarEn('/');
  const seccion = screen.getByRole('region', { name: 'Nuestros planes' });
  expect(within(seccion).getAllByRole('article')).toHaveLength(3);
});

test('muestra los cinco productos on demand', () => {
  montarEn('/');
  const seccion = screen.getByRole('region', { name: 'Productos on demand' });
  expect(within(seccion).getAllByRole('article')).toHaveLength(5);
});

test('el encabezado de "Productos on demand" enlaza a la pestaña de productos', () => {
  montarEn('/');
  const seccion = screen.getByRole('region', { name: 'Productos on demand' });
  expect(within(seccion).getByRole('link', { name: 'Ver todos los productos' })).toHaveAttribute(
    'href',
    '/catalogo?tab=productos',
  );
});

test('las preguntas frecuentes tienen las 12 preguntas reales', () => {
  montarEn('/');
  const seccion = screen.getByRole('region', { name: 'Preguntas frecuentes' });
  // `<details>` mapea a role "group" (verificado contra jsdom/aria-query):
  // recorre el árbol de accesibilidad igual que las otras listas de esta página.
  expect(within(seccion).getAllByRole('group')).toHaveLength(12);
});

test('la respuesta de suscripción habla de elegir entre los tres planes, no de "el plan" en singular', () => {
  montarEn('/');
  const seccion = screen.getByRole('region', { name: 'Preguntas frecuentes' });
  expect(within(seccion).getByText('¿Cómo me suscribo?')).toBeInTheDocument();
  expect(within(seccion).getByText(/Elegís uno de los tres planes \(Nexo I, II o III\)/)).toBeInTheDocument();
});

test('la respuesta de teleconsultas es verdadera para Nexo III (tope en pesos, no consulta gratis)', () => {
  montarEn('/');
  const seccion = screen.getByRole('region', { name: 'Preguntas frecuentes' });
  expect(within(seccion).getByText('¿Cuántas teleconsultas puedo realizar por mes?')).toBeInTheDocument();
  expect(
    within(seccion).getByText(/Nexo III no incluye una consulta gratis, sino una cobertura de \$10\.000/),
  ).toBeInTheDocument();
});

test('la recuperación de cuenta habla de Magic Link, no de una contraseña que no existe', () => {
  montarEn('/');
  const seccion = screen.getByRole('region', { name: 'Preguntas frecuentes' });
  // Positivo Y negativo: el alta es sin contraseña (`docs/CONTEXTO.md`), así
  // que la respuesta tiene que nombrar el mecanismo real (Magic Link) y no
  // dejar colada la mención a una contraseña inexistente.
  expect(within(seccion).getByText(/Magic Link \(sin contraseña\)/)).toBeInTheDocument();
  expect(seccion).not.toHaveTextContent('Olvidé mi contraseña');
});

test('cuándo puedo usar los servicios aclara qué depende del plan (emergencias y odontología no son de todos)', () => {
  montarEn('/');
  const seccion = screen.getByRole('region', { name: 'Preguntas frecuentes' });
  expect(
    within(seccion).getByText(/emergencias médicas y guardia odontológica en Nexo I; farmacia en Nexo I y Nexo II/),
  ).toBeInTheDocument();
});

test('la foto del hero tiene alt descriptivo (no genérico) y carga con prioridad alta', () => {
  montarEn('/');
  const foto = screen.getByAltText(/Mujer sonriendo mientras mira la app de Nexo en su celular/);
  expect(foto.tagName).toBe('IMG');
  expect(foto).toHaveAttribute('fetchpriority', 'high');
  expect(foto).toHaveAttribute('loading', 'eager');
});

test('las fotos de la composición de "Cómo funciona" tienen alt descriptivo, no genérico', () => {
  montarEn('/');
  const seccion = screen.getByRole('region', { name: 'Cómo funciona' });
  expect(
    within(seccion).getByAltText(/Grupo de amigos sonriendo mientras miran juntos el celular/),
  ).toBeInTheDocument();
  expect(
    within(seccion).getByAltText(/Mujer haciendo una videollamada de telemedicina con una doctora/),
  ).toBeInTheDocument();
});
