import { render, screen } from '@testing-library/react';
import { LogoNexo, ETIQUETA_MARCA } from '@/ui/LogoNexo';

test('por defecto es un img accesible con el nombre de marca', () => {
  render(<LogoNexo />);
  expect(screen.getByRole('img', { name: ETIQUETA_MARCA })).toBeInTheDocument();
});

test('con etiqueta null queda oculto para el lector de pantalla (lo nombra el contenedor)', () => {
  const { container } = render(<LogoNexo etiqueta={null} />);
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
});

test('una etiqueta vacía sigue siendo un nombre explícito, no cae en la rama decorativa', () => {
  // `''` es un string legal (distinto de `null`): tiene que seguir contando
  // como "el logo se nombra a sí mismo", aunque el nombre quede vacío.
  const { container } = render(<LogoNexo etiqueta="" />);
  expect(container.querySelector('[role="img"]')).toBeInTheDocument();
  expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
});

test('conserva el aspect-ratio real del PNG (722×240) para no deformar la máscara', () => {
  render(<LogoNexo alto={20} />);
  const logo = screen.getByRole('img', { name: ETIQUETA_MARCA });
  expect(logo).toHaveStyle({ height: '20px', width: '60px' });
});

test('variante marca (default) se pinta con el degradado de marca', () => {
  render(<LogoNexo />);
  const logo = screen.getByRole('img', { name: ETIQUETA_MARCA });
  expect(logo).toHaveStyle({ background: 'linear-gradient(135deg, var(--color-marca-600) 0%, var(--color-marca-300) 100%)' });
});

test('variante blanca se pinta sólida, para foto oscura o superficie marca-600/700', () => {
  render(<LogoNexo variante="blanca" />);
  const logo = screen.getByRole('img', { name: ETIQUETA_MARCA });
  expect(logo).toHaveStyle({ background: 'rgb(255, 255, 255)' });
});

test('ignora forced-colors: el logo no depende de la máscara sola para tener contraste', () => {
  render(<LogoNexo />);
  const logo = screen.getByRole('img', { name: ETIQUETA_MARCA });
  expect(logo).toHaveStyle({ forcedColorAdjust: 'none' });
});
