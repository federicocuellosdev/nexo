import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PerfilWizard } from '@/features/perfil/PerfilWizard';
import { desdePerfil } from '@/features/perfil/validacion';
import { PERFIL_DEMO } from '@/mock/usuarios';

async function completarPaso1(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.type(screen.getByLabelText(/^Número de documento/), '35123456');
  await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
}

async function completarPaso2(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.type(screen.getByLabelText(/^Nombre/), 'Camila');
  await usuario.type(screen.getByLabelText(/^Apellido/), 'Pérez');
  await usuario.selectOptions(screen.getByLabelText(/^Sexo/), 'F');
  await usuario.type(screen.getByLabelText(/^Fecha de nacimiento/), '1990-04-17');
  await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
}

async function completarPaso3(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.type(screen.getByLabelText(/^Calle/), 'Córdoba');
  await usuario.type(screen.getByLabelText(/^Número/), '1234');
  await usuario.type(screen.getByLabelText('Piso y departamento'), '3 B');
  await usuario.type(screen.getByLabelText(/^Localidad/), 'Rosario');
  await usuario.type(screen.getByLabelText(/^Provincia/), 'Santa Fe');
  await usuario.type(screen.getByLabelText(/^Código postal/), '2000');
  await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
}

test('arranca en el paso 1 de 4', () => {
  render(<PerfilWizard onGuardar={vi.fn()} />);
  expect(screen.getByText('Paso 1 de 4')).toBeInTheDocument();
  expect(screen.getByLabelText(/^Número de documento/)).toBeInTheDocument();
});

test('la barra de progreso informa el avance', () => {
  render(<PerfilWizard onGuardar={vi.fn()} />);
  const barra = screen.getByRole('progressbar');
  expect(barra).toHaveAttribute('aria-valuenow', '1');
  expect(barra).toHaveAttribute('aria-valuemax', '4');
});

test('no deja avanzar con el paso incompleto', async () => {
  const usuario = userEvent.setup();
  render(<PerfilWizard onGuardar={vi.fn()} />);
  await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Ingresá tu número de documento');
  expect(screen.getByText('Paso 1 de 4')).toBeInTheDocument();
});

test('avanza cuando el paso es válido', async () => {
  const usuario = userEvent.setup();
  render(<PerfilWizard onGuardar={vi.fn()} />);
  await completarPaso1(usuario);
  expect(screen.getByText('Paso 2 de 4')).toBeInTheDocument();
  expect(screen.getByLabelText(/^Sexo/)).toBeInTheDocument();
});

test('volver atrás conserva lo cargado', async () => {
  const usuario = userEvent.setup();
  render(<PerfilWizard onGuardar={vi.fn()} />);
  await completarPaso1(usuario);
  await usuario.click(screen.getByRole('button', { name: 'Volver' }));
  expect(screen.getByLabelText(/^Número de documento/)).toHaveValue('35123456');
});

test('el paso 1 no ofrece volver porque no hay a dónde', () => {
  render(<PerfilWizard onGuardar={vi.fn()} />);
  expect(screen.queryByRole('button', { name: 'Volver' })).not.toBeInTheDocument();
});

test('los campos en debate llevan el badge "opcional · a definir"', async () => {
  const usuario = userEvent.setup();
  render(<PerfilWizard onGuardar={vi.fn()} />);
  await completarPaso1(usuario);
  await completarPaso2(usuario);
  await completarPaso3(usuario);
  expect(screen.getAllByText('opcional · a definir').length).toBeGreaterThan(0);
});

test('el paso 4 pide el tipo de contratación pero no la obra social', async () => {
  const usuario = userEvent.setup();
  render(<PerfilWizard onGuardar={vi.fn()} />);
  await completarPaso1(usuario);
  await completarPaso2(usuario);
  await completarPaso3(usuario);
  await usuario.click(screen.getByRole('button', { name: 'Guardar y activar' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Elegí el tipo de contratación');
});

test('guardar entrega el perfil armado', async () => {
  const usuario = userEvent.setup();
  const alGuardar = vi.fn();
  render(<PerfilWizard onGuardar={alGuardar} />);

  await completarPaso1(usuario);
  await completarPaso2(usuario);
  await completarPaso3(usuario);
  await usuario.selectOptions(screen.getByLabelText('¿Tenés obra social o prepaga?'), 'si');
  await usuario.type(screen.getByLabelText('¿Cuál?'), 'OSDE');
  await usuario.selectOptions(screen.getByLabelText(/^Tipo de contratación/), 'tomador-beneficiario');
  await usuario.click(screen.getByRole('button', { name: 'Guardar y activar' }));

  // Dos destinos separados: `perfil` va a sesion.perfil e `identidad` a
  // sesion.usuario. Nombre y apellido NO viajan dentro del perfil.
  expect(alGuardar).toHaveBeenCalledWith({
    perfil: PERFIL_DEMO,
    identidad: { nombre: 'Camila', apellido: 'Pérez' },
  });
});

test('puede abrir en un paso puntual con el borrador ya cargado', () => {
  render(<PerfilWizard pasoInicial={3} borradorInicial={desdePerfil(PERFIL_DEMO)} onGuardar={vi.fn()} />);
  expect(screen.getByText('Paso 3 de 4')).toBeInTheDocument();
  expect(screen.getByLabelText(/^Localidad/)).toHaveValue('Rosario');
});

test('con soloEstePaso guarda el paso puntual en un solo clic, sin pedir los siguientes', async () => {
  const usuario = userEvent.setup();
  const alGuardar = vi.fn();
  render(
    <PerfilWizard
      pasoInicial={1}
      borradorInicial={desdePerfil(PERFIL_DEMO, { nombre: 'Camila', apellido: 'Pérez' })}
      soloEstePaso
      onGuardar={alGuardar}
    />,
  );

  expect(screen.queryByRole('button', { name: 'Continuar' })).not.toBeInTheDocument();
  await usuario.click(screen.getByRole('button', { name: 'Guardar cambios' }));

  expect(alGuardar).toHaveBeenCalledWith({
    perfil: PERFIL_DEMO,
    identidad: { nombre: 'Camila', apellido: 'Pérez' },
  });
});

test('con soloEstePaso no ofrece volver a un paso anterior', () => {
  render(
    <PerfilWizard
      pasoInicial={3}
      borradorInicial={desdePerfil(PERFIL_DEMO)}
      soloEstePaso
      onGuardar={vi.fn()}
    />,
  );
  expect(screen.queryByRole('button', { name: 'Volver' })).not.toBeInTheDocument();
});

test('con soloEstePaso sigue validando el paso antes de guardar', async () => {
  const usuario = userEvent.setup();
  const alGuardar = vi.fn();
  render(<PerfilWizard pasoInicial={1} soloEstePaso onGuardar={alGuardar} />);

  await usuario.click(screen.getByRole('button', { name: 'Guardar cambios' }));

  expect(screen.getByRole('alert')).toHaveTextContent('Ingresá tu número de documento');
  expect(alGuardar).not.toHaveBeenCalled();
});
