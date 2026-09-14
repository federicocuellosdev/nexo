import { render, screen } from '@testing-library/react';
import { CredencialCard, type DatosCredencial } from '@/features/credencial/CredencialCard';

const DATOS: DatosCredencial = {
  nombre: 'Camila Pérez',
  plan: 'Nexo II',
  numeroAfiliado: '1547',
  vigenteHasta: '01/10/2026',
};

function montar(datos: DatosCredencial = DATOS) {
  return render(
    <CredencialCard datos={datos} estado="activo" origen="https://portal.nexo.ar" />,
  );
}

test('muestra nombre, plan y vigencia', () => {
  montar();
  expect(screen.getByText('Camila Pérez')).toBeInTheDocument();
  expect(screen.getByText('Nexo II')).toBeInTheDocument();
  expect(screen.getByText('Vigente hasta 01/10/2026')).toBeInTheDocument();
});

test('muestra el número de afiliado y el de farmacia derivado', () => {
  montar();
  expect(screen.getByText('1547')).toBeInTheDocument();
  expect(screen.getByText('289000015470000')).toBeInTheDocument();
});

test('los números se pintan sin formatear', () => {
  montar();
  // Ni separadores de miles, ni relleno, ni mayúsculas: el formato lo define
  // quien genera el número, no la vista.
  expect(screen.queryByText('1.547')).not.toBeInTheDocument();
  expect(screen.queryByText('289 0000 1547 0000')).not.toBeInTheDocument();
});

test('sin número de farmacia válido no se pinta el bloque', () => {
  // 9 dígitos: no entra en los 8 del tramo variable.
  montar({ ...DATOS, numeroAfiliado: '123456789' });
  expect(screen.getByText('123456789')).toBeInTheDocument();
  expect(screen.queryByText('N° farmacia')).not.toBeInTheDocument();
});

test('el QR es además un enlace real a la verificación', () => {
  montar();
  // Un QR suelto sólo sirve a quien puede escanearlo. Envuelto en un enlace,
  // quien navega con teclado o lector de pantalla llega al mismo destino.
  const enlace = screen.getByRole('link', { name: 'Verificar esta credencial' });
  expect(enlace).toHaveAttribute('href', 'https://portal.nexo.ar/verificar/1547');
});

test('lleva el chip de estado de la cobertura', () => {
  montar();
  expect(screen.getByText('Activa')).toBeInTheDocument();
});
