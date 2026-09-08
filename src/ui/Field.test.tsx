import { render, screen } from '@testing-library/react';
import { Field } from '@/ui/Field';
import { Input } from '@/ui/Input';

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
