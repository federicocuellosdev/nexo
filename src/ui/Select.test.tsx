import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '@/ui/Select';

const OPCIONES = [
  { value: 'DNI', label: 'DNI' },
  { value: 'Pasaporte', label: 'Pasaporte' },
];

test('renderiza todas las opciones', () => {
  render(<Select id="doc" aria-label="Tipo de documento" opciones={OPCIONES} />);
  expect(screen.getAllByRole('option')).toHaveLength(2);
});

test('el placeholder agrega una opción vacía deshabilitada', () => {
  render(
    <Select id="doc" aria-label="Tipo de documento" opciones={OPCIONES} placeholder="Elegí una opción" defaultValue="" />,
  );
  const vacia = screen.getByRole('option', { name: 'Elegí una opción' });
  expect(vacia).toBeDisabled();
});

test('cambia el valor elegido', async () => {
  const usuario = userEvent.setup();
  render(<Select id="doc" aria-label="Tipo de documento" opciones={OPCIONES} defaultValue="DNI" />);
  await usuario.selectOptions(screen.getByLabelText('Tipo de documento'), 'Pasaporte');
  expect(screen.getByLabelText('Tipo de documento')).toHaveValue('Pasaporte');
});
