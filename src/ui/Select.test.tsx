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

test('standalone: invalido expone aria-invalid pero nunca un aria-describedby colgante', () => {
  render(<Select id="doc" aria-label="Tipo de documento" opciones={OPCIONES} invalido />);
  const campo = screen.getByLabelText('Tipo de documento');
  expect(campo).toHaveAttribute('aria-invalid', 'true');
  expect(campo).not.toHaveAttribute('aria-describedby');
});

test('con placeholder y defaultValue="" la opción seleccionada es el placeholder', () => {
  render(
    <Select
      id="doc"
      aria-label="Tipo de documento"
      opciones={OPCIONES}
      placeholder="Elegí una opción"
      defaultValue=""
    />,
  );
  expect(screen.getByLabelText('Tipo de documento')).toHaveValue('');
});

test('con placeholder pero sin value/defaultValue, la opción seleccionada es la primera real', () => {
  render(<Select id="doc" aria-label="Tipo de documento" opciones={OPCIONES} placeholder="Elegí una opción" />);
  expect(screen.getByLabelText('Tipo de documento')).toHaveValue('DNI');
});
