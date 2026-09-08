import { render, screen } from '@testing-library/react';
import { Sheet } from '@/ui/Sheet';

test('abierto expone el diálogo con su nombre', () => {
  render(
    <Sheet abierto onCambio={() => {}} titulo="Contratar Nexo II">
      <p>cuerpo</p>
    </Sheet>,
  );
  expect(screen.getByRole('dialog', { name: 'Contratar Nexo II' })).toBeInTheDocument();
});

test('en mobile se ancla abajo y en md pasa a centrado', () => {
  render(
    <Sheet abierto onCambio={() => {}} titulo="Contratar Nexo II">
      <p>cuerpo</p>
    </Sheet>,
  );
  const hoja = screen.getByRole('dialog');
  expect(hoja).toHaveClass('bottom-0');
  expect(hoja).toHaveClass('md:top-1/2');
});
