import { render, screen } from '@testing-library/react';
import { Field } from '@/ui/Field';
import { Input } from '@/ui/Input';
import { Select } from '@/ui/Select';

test('la etiqueta queda asociada al control', () => {
  render(
    <Field label="Nombre" htmlFor="nombre">
      <Input id="nombre" />
    </Field>,
  );
  expect(screen.getByLabelText('Nombre')).toBe(screen.getByRole('textbox'));
});

test('el error se anuncia como alerta', () => {
  render(
    <Field label="Email" htmlFor="email" error="Ingresá tu email">
      <Input id="email" invalido />
    </Field>,
  );
  expect(screen.getByRole('alert')).toHaveTextContent('Ingresá tu email');
});

test('la ayuda se oculta cuando hay error para no duplicar mensajes', () => {
  render(
    <Field label="Teléfono" htmlFor="tel" ayuda="Sin 0 ni 15" error="Falta el teléfono">
      <Input id="tel" invalido />
    </Field>,
  );
  expect(screen.queryByText('Sin 0 ni 15')).not.toBeInTheDocument();
});

test('puede llevar un adorno a la derecha de la etiqueta', () => {
  render(
    <Field label="Obra social" htmlFor="os" extra={<span>opcional · a definir</span>}>
      <Input id="os" />
    </Field>,
  );
  expect(screen.getByText('opcional · a definir')).toBeInTheDocument();
});

test('el control queda descrito por la ayuda vía aria-describedby', () => {
  render(
    <Field label="Teléfono" htmlFor="tel" ayuda="Sin 0 ni 15">
      <Input id="tel" />
    </Field>,
  );
  const control = screen.getByLabelText('Teléfono');
  const ayuda = screen.getByText('Sin 0 ni 15');
  expect(ayuda).toHaveAttribute('id', 'tel-ayuda');
  expect(control).toHaveAttribute('aria-describedby', 'tel-ayuda');
});

test('el aria-describedby apunta al error en vez de a la ayuda cuando hay error', () => {
  render(
    <Field label="Teléfono" htmlFor="tel" ayuda="Sin 0 ni 15" error="Falta el teléfono">
      <Input id="tel" invalido />
    </Field>,
  );
  const control = screen.getByLabelText('Teléfono');
  const error = screen.getByRole('alert');
  expect(error).toHaveAttribute('id', 'tel-error');
  expect(control).toHaveAttribute('aria-describedby', 'tel-error');
});

test('requerido marca el control con aria-required', () => {
  render(
    <Field label="DNI" htmlFor="dni" requerido>
      <Input id="dni" />
    </Field>,
  );
  expect(screen.getByLabelText(/DNI/)).toHaveAttribute('aria-required', 'true');
});

test('un Select dentro de Field también recibe aria-describedby y aria-required', () => {
  render(
    <Field label="Tipo de documento" htmlFor="doc" ayuda="Elegí uno" requerido>
      <Select id="doc" opciones={[{ value: 'DNI', label: 'DNI' }]} />
    </Field>,
  );
  const control = screen.getByLabelText(/Tipo de documento/);
  expect(control).toHaveAttribute('aria-describedby', 'doc-ayuda');
  expect(control).toHaveAttribute('aria-required', 'true');
});
