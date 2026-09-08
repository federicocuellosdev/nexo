import { render, screen } from '@testing-library/react';
import { NovedadesCarousel } from '@/features/novedades/NovedadesCarousel';
import { NOVEDADES } from '@/mock/novedades';

test('renderiza una tarjeta por novedad', () => {
  render(<NovedadesCarousel novedades={NOVEDADES} />);
  expect(screen.getAllByRole('listitem')).toHaveLength(3);
});

test('la lista está etiquetada para el lector de pantalla', () => {
  render(<NovedadesCarousel novedades={NOVEDADES} />);
  expect(screen.getByRole('list', { name: 'Novedades' })).toBeInTheDocument();
});

test('el carrusel scrollea horizontalmente con anclaje', () => {
  const { container } = render(<NovedadesCarousel novedades={NOVEDADES} />);
  const pista = container.querySelector('ul');
  expect(pista).toHaveClass('overflow-x-auto');
  expect(pista).toHaveClass('snap-x');
});

test('sin novedades no renderiza nada', () => {
  const { container } = render(<NovedadesCarousel novedades={[]} />);
  expect(container).toBeEmptyDOMElement();
});
