import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rutas } from '@/router';
import { getSession, resetSession, setSession } from '@/mock/session';
import { USUARIO_DEMO } from '@/mock/usuarios';

function montar() {
  const router = createMemoryRouter(rutas, { initialEntries: ['/pago'] });
  return render(<RouterProvider router={router} />);
}

beforeEach(() => {
  resetSession();
  setSession({ usuario: USUARIO_DEMO, intent: { tipo: 'plan', id: 'nexo-2' } });
});

test('avisa que el checkout es una simulación', () => {
  montar();
  expect(screen.getByText('Simulación — acá irá Mercado Pago')).toBeInTheDocument();
});

test('resume el concepto y el monto', () => {
  montar();
  expect(screen.getByText('Nexo II · cuota mensual')).toBeInTheDocument();
  expect(screen.getByText('$12.000,00')).toBeInTheDocument();
});

test('muestra un medio de pago ficticio', () => {
  montar();
  expect(screen.getByText(/•••• 4242/)).toBeInTheDocument();
});

test('pagar crea una orden pagada y lleva al éxito', async () => {
  const usuario = userEvent.setup();
  montar();
  await usuario.click(screen.getByRole('button', { name: 'Pagar $12.000' }));

  expect(screen.getByRole('heading', { name: '¡Gracias por tu pago!' })).toBeInTheDocument();

  const ordenes = getSession().ordenes;
  expect(ordenes).toHaveLength(1);
  expect(ordenes[0]).toMatchObject({
    tipo: 'plan',
    itemId: 'nexo-2',
    concepto: 'Nexo II · cuota mensual',
    monto: 12000,
    estado: 'pagada',
  });
});

test('sin intención manda a planes en vez de cobrar cualquier cosa', () => {
  setSession({ usuario: USUARIO_DEMO, intent: undefined });
  montar();
  expect(screen.queryByRole('button', { name: /Pagar/ })).not.toBeInTheDocument();
});
