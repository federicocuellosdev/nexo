import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog } from '@/ui/Dialog';

test('cerrado no renderiza contenido', () => {
  render(
    <Dialog abierto={false} onCambio={() => {}} titulo="Contratar">
      <p>cuerpo</p>
    </Dialog>,
  );
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('abierto muestra el título accesible y el contenido', () => {
  render(
    <Dialog abierto onCambio={() => {}} titulo="Contratar" descripcion="Completá tus datos">
      <p>cuerpo</p>
    </Dialog>,
  );
  expect(screen.getByRole('dialog', { name: 'Contratar' })).toBeInTheDocument();
  expect(screen.getByText('Completá tus datos')).toBeInTheDocument();
});

test('el botón cerrar avisa el cambio de estado', async () => {
  const usuario = userEvent.setup();
  const alCambiar = vi.fn();
  render(
    <Dialog abierto onCambio={alCambiar} titulo="Contratar">
      <p>cuerpo</p>
    </Dialog>,
  );
  await usuario.click(screen.getByRole('button', { name: 'Cerrar' }));
  expect(alCambiar).toHaveBeenCalledWith(false);
});

test('Escape cierra el diálogo', async () => {
  const usuario = userEvent.setup();
  const alCambiar = vi.fn();
  render(
    <Dialog abierto onCambio={alCambiar} titulo="Contratar">
      <p>cuerpo</p>
    </Dialog>,
  );
  await usuario.keyboard('{Escape}');
  expect(alCambiar).toHaveBeenCalledWith(false);
});
