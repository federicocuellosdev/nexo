import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rutas } from '@/router';
import { agregarOrden, getSession, resetSession, setSession } from '@/mock/session';
import { PERFIL_DEMO, USUARIO_DEMO } from '@/mock/usuarios';

function montar() {
  const router = createMemoryRouter(rutas, { initialEntries: ['/perfil/completar'] });
  return render(<RouterProvider router={router} />);
}

beforeEach(() => {
  resetSession();
});

/**
 * `/perfil/completar` está detrás de `RequierePago`: solo entra quien
 * ya pagó y le falta el perfil. Sembrar solo el usuario dejaba la sesión en
 * `conCuentaSinPago` y el guard rebota — que es justamente el agujero que se
 * cerró: antes se podía completar el perfil sin haber pagado nunca.
 */
function sembrarPagadoSinPerfil() {
  setSession({ usuario: USUARIO_DEMO });
  agregarOrden({
    id: 'ord-test-nexo-2',
    fecha: '2026-09-01',
    tipo: 'plan',
    itemId: 'nexo-2',
    concepto: 'Nexo II · cuota mensual',
    monto: 12000,
    estado: 'pagada',
  });
}

test('muestra el wizard con su explicación', () => {
  sembrarPagadoSinPerfil();
  montar();
  expect(screen.getByRole('heading', { level: 1, name: 'Completá tu perfil' })).toBeInTheDocument();
  expect(screen.getByText('Paso 1 de 4')).toBeInTheDocument();
});

test('al guardar deja el perfil en la sesión y lleva al inicio con el aviso', async () => {
  const usuario = userEvent.setup();
  sembrarPagadoSinPerfil();
  montar();

  // El wizard de /perfil/completar viene PRE-CARGADO con `BORRADOR_DEMO`
  // (datos de prueba espejo de PERFIL_DEMO). Recorrer el flujo es sólo
  // avanzar los 4 pasos sin tipear nada: Continuar × 3 → Guardar y activar.
  await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
  await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
  await usuario.click(screen.getByRole('button', { name: 'Continuar' }));
  await usuario.click(screen.getByRole('button', { name: 'Guardar y activar' }));

  expect(getSession().perfil).toEqual(PERFIL_DEMO);
  // La navegación efectivamente llega a /inicio (y no al ErrorBoundary de
  // React Router, que quedaba silenciosamente mal hasta que la Task 15 creó
  // la ruta): se ve el saludo de Inicio y el aviso que llega por `state`.
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hola, Camila');
  expect(screen.getByRole('status')).toHaveTextContent('Cobertura activa');
});
