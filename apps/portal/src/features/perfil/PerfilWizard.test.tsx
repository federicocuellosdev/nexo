import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PerfilWizard } from '@/features/perfil/PerfilWizard';
import { BORRADOR_INICIAL, desdePerfil } from '@/features/perfil/validacion';
import { PERFIL_DEMO } from '@/mock/usuarios';

/**
 * El `<Select>` del portal es un combobox custom (botón + popover de listbox),
 * así que `userEvent.selectOptions` no sirve: hay que abrir el popover y
 * clickear la opción como lo haría una persona.
 */
async function elegirDelSelect(
  usuario: ReturnType<typeof userEvent.setup>,
  etiqueta: RegExp | string,
  opcionLabel: string,
) {
  await usuario.click(screen.getByLabelText(etiqueta));
  await usuario.click(screen.getByRole('option', { name: opcionLabel }));
}

async function completarPaso1(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.type(screen.getByLabelText(/^Número de documento/), '35123456');
  await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
}

async function completarPaso2(usuario: ReturnType<typeof userEvent.setup>) {
  // Nombre y apellido ya no viven en el paso 2 (vienen del alta); sólo
  // sexo y fecha de nacimiento siguen en este paso. La fecha es un combo de
  // 3 selects (Día / Mes / Año) — mismo pattern que el BirthDatePicker real.
  await elegirDelSelect(usuario, /^Sexo/, 'Femenino');
  await elegirDelSelect(usuario, 'Día', '17');
  await elegirDelSelect(usuario, 'Mes', 'abril');
  await elegirDelSelect(usuario, 'Año', '1990');
  await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
}

async function completarPaso3(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.type(screen.getByLabelText(/^Calle/), 'Córdoba');
  await usuario.type(screen.getByLabelText(/^Número/), '1234');
  await usuario.type(screen.getByLabelText(/^Piso/), '3');
  await usuario.type(screen.getByLabelText(/^Departamento/), 'B');
  // Torre queda vacía a propósito: no todos los domicilios viven en una.
  // Localidad es un Select con el catálogo heredado de v2 (3 opciones de
  // Santa Fe). Al elegirla, Provincia se autocompleta con "Santa Fe".
  await elegirDelSelect(usuario, /^Localidad/, 'Rosario');
  await usuario.type(screen.getByLabelText(/^Código postal/), '2000');
  // Provincia y País: el pick de localidad y el borrador inicial dejan los
  // valores correctos, así que no hace falta tipearlos.
  await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
}

test('arranca en el paso 1 de 4', () => {
  render(<PerfilWizard onGuardar={vi.fn()} />);
  expect(screen.getByText('Paso 1 de 3')).toBeInTheDocument();
  expect(screen.getByLabelText(/^Número de documento/)).toBeInTheDocument();
});

test('la barra de progreso informa el avance', () => {
  render(<PerfilWizard onGuardar={vi.fn()} />);
  const barra = screen.getByRole('progressbar');
  expect(barra).toHaveAttribute('aria-valuenow', '1');
  expect(barra).toHaveAttribute('aria-valuemax', '3');
});

test('no deja avanzar con el paso incompleto', async () => {
  const usuario = userEvent.setup();
  render(<PerfilWizard onGuardar={vi.fn()} />);
  await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Ingresá tu número de documento');
  expect(screen.getByText('Paso 1 de 3')).toBeInTheDocument();
});

test('avanza cuando el paso es válido', async () => {
  const usuario = userEvent.setup();
  render(<PerfilWizard onGuardar={vi.fn()} />);
  await completarPaso1(usuario);
  expect(screen.getByText('Paso 2 de 3')).toBeInTheDocument();
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

test('guardar entrega el perfil armado al terminar el paso 3', async () => {
  const usuario = userEvent.setup();
  const alGuardar = vi.fn();
  // Nombre/apellido se precargan desde el borrador porque /perfil/completar
  // los pasa desde el alta — el wizard ya no los pide en el paso 2.
  render(
    <PerfilWizard
      borradorInicial={{ ...BORRADOR_INICIAL, nombre: 'Camila', apellido: 'Pérez' }}
      onGuardar={alGuardar}
    />,
  );

  await completarPaso1(usuario);
  await completarPaso2(usuario);
  // Paso 3 es el último del titular. "Continuar" ahora dice "Guardar y activar".
  await completarPaso3(usuario);

  // Dos destinos separados: `perfil` va a sesion.perfil e `identidad` a
  // sesion.usuario. Nombre y apellido NO viajan dentro del perfil.
  expect(alGuardar).toHaveBeenCalledWith({
    perfil: PERFIL_DEMO,
    identidad: { nombre: 'Camila', apellido: 'Pérez' },
  });
});

test('puede abrir en un paso puntual con el borrador ya cargado', () => {
  render(<PerfilWizard pasoInicial={3} borradorInicial={desdePerfil(PERFIL_DEMO)} onGuardar={vi.fn()} />);
  expect(screen.getByText('Paso 3 de 3')).toBeInTheDocument();
  // Localidad es un combobox custom (no un `<select>`): no tiene `.value`,
  // el valor elegido se muestra como texto dentro del botón.
  expect(screen.getByLabelText(/^Localidad/)).toHaveTextContent('Rosario');
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
