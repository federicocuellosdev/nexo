import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, clasesBoton } from '@/ui/Button';

test('renderiza un botón de tipo button por defecto para no enviar formularios sin querer', () => {
  render(<Button>Contratar</Button>);
  expect(screen.getByRole('button', { name: 'Contratar' })).toHaveAttribute('type', 'button');
});

test('el CTA primario usa el degradado de marca', () => {
  render(<Button>Contratar</Button>);
  expect(screen.getByRole('button', { name: 'Contratar' })).toHaveClass('bg-brand');
});

test('la variante secundaria no usa el degradado', () => {
  render(<Button variante="secundario">Ver planes</Button>);
  expect(screen.getByRole('button', { name: 'Ver planes' })).not.toHaveClass('bg-brand');
});

test('ancho full ocupa todo el contenedor', () => {
  render(<Button ancho="full">Pagar</Button>);
  expect(screen.getByRole('button', { name: 'Pagar' })).toHaveClass('w-full');
});

test('dispara onClick', async () => {
  const usuario = userEvent.setup();
  const alHacerClic = vi.fn();
  render(<Button onClick={alHacerClic}>Contratar</Button>);
  await usuario.click(screen.getByRole('button', { name: 'Contratar' }));
  expect(alHacerClic).toHaveBeenCalledTimes(1);
});

test('deshabilitado no dispara onClick', async () => {
  const usuario = userEvent.setup();
  const alHacerClic = vi.fn();
  render(
    <Button disabled onClick={alHacerClic}>
      Contratar
    </Button>,
  );
  await usuario.click(screen.getByRole('button', { name: 'Contratar' }));
  expect(alHacerClic).not.toHaveBeenCalled();
});

test('clasesBoton devuelve las mismas clases para un enlace con apariencia de botón', () => {
  const clases = clasesBoton({ variante: 'secundario', tamano: 'sm' });
  expect(clases).toContain('rounded-pill');
  expect(clases).toContain('h-9');
});
