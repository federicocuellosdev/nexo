import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/ui/Input';

test('escribe el valor', async () => {
  const usuario = userEvent.setup();
  render(<Input id="nombre" aria-label="Nombre" />);
  await usuario.type(screen.getByLabelText('Nombre'), 'Camila');
  expect(screen.getByLabelText('Nombre')).toHaveValue('Camila');
});

test('marcado como inválido expone aria-invalid y apunta al mensaje de error', () => {
  render(<Input id="email" aria-label="Email" invalido />);
  const campo = screen.getByLabelText('Email');
  expect(campo).toHaveAttribute('aria-invalid', 'true');
  expect(campo).toHaveAttribute('aria-describedby', 'email-error');
});

test('sin error no ensucia el DOM con aria-invalid', () => {
  render(<Input id="email" aria-label="Email" />);
  expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid');
});
