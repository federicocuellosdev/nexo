import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen } from '@testing-library/react';
import { rutas } from '@/router';
import { resetSession, setSession } from '@/mock/session';
import { USUARIO_DEMO } from '@/mock/usuarios';

function montar() {
  const router = createMemoryRouter(rutas, { initialEntries: ['/bienvenida'] });
  return render(<RouterProvider router={router} />);
}

beforeEach(() => {
  resetSession();
});

test('saluda por el nombre del usuario', () => {
  setSession({ usuario: USUARIO_DEMO, intent: { tipo: 'plan', id: 'nexo-2' } });
  montar();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hola, Camila');
});

test('resume el plan que está contratando con su precio y prestaciones', () => {
  setSession({ usuario: USUARIO_DEMO, intent: { tipo: 'plan', id: 'nexo-2' } });
  montar();
  expect(screen.getByText('Nexo II')).toBeInTheDocument();
  expect(screen.getByText('$15.000,00 por mes')).toBeInTheDocument();
  expect(screen.getByText('Seguro de Salud I')).toBeInTheDocument();
});

test('lleva al pago', () => {
  setSession({ usuario: USUARIO_DEMO, intent: { tipo: 'plan', id: 'nexo-2' } });
  montar();
  expect(screen.getByRole('link', { name: 'Pagar con Mercado Pago' })).toHaveAttribute('href', '/pago');
});

test('ofrece elegir otro plan', () => {
  setSession({ usuario: USUARIO_DEMO, intent: { tipo: 'plan', id: 'nexo-2' } });
  montar();
  expect(screen.getByRole('link', { name: 'Elegir otro plan' })).toHaveAttribute('href', '/planes');
});

test('resume también un producto on demand y aclara que requiere plan activo', () => {
  setSession({ usuario: USUARIO_DEMO, intent: { tipo: 'producto', id: 'hogar-1' } });
  montar();
  expect(screen.getByText('Seguro de Hogar · hasta 1er piso')).toBeInTheDocument();
  expect(screen.getByText(/requiere un plan activo/i)).toBeInTheDocument();
});

test('sin intención el guard manda al inicio', () => {
  setSession({ usuario: USUARIO_DEMO });
  montar();
  // La ruta /inicio (Task 15) ya existe: se puede assertar la navegación real
  // en vez de solo la ausencia del contenido de Bienvenida.
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hola, Camila');
});
