import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabPanel, Tabs } from '@/ui/Tabs';

const ITEMS = [
  { valor: 'planes', label: 'Planes' },
  { valor: 'productos', label: 'Productos' },
];

function Ejemplo() {
  const [valor, setValor] = useState('planes');
  return (
    <Tabs valor={valor} onCambio={setValor} items={ITEMS} etiqueta="Catálogo">
      <TabPanel valor="planes">contenido de planes</TabPanel>
      <TabPanel valor="productos">contenido de productos</TabPanel>
    </Tabs>
  );
}

test('muestra el panel de la pestaña activa', () => {
  render(<Ejemplo />);
  expect(screen.getByText('contenido de planes')).toBeInTheDocument();
  expect(screen.queryByText('contenido de productos')).not.toBeInTheDocument();
});

test('cambiar de pestaña cambia el panel', async () => {
  const usuario = userEvent.setup();
  render(<Ejemplo />);
  await usuario.click(screen.getByRole('tab', { name: 'Productos' }));
  expect(screen.getByText('contenido de productos')).toBeInTheDocument();
});

test('la lista de pestañas está etiquetada', () => {
  render(<Ejemplo />);
  expect(screen.getByRole('tablist', { name: 'Catálogo' })).toBeInTheDocument();
});

test('la pestaña activa queda marcada para el lector de pantalla', () => {
  render(<Ejemplo />);
  expect(screen.getByRole('tab', { name: 'Planes' })).toHaveAttribute('aria-selected', 'true');
});
