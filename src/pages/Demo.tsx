import { Link } from 'react-router';
import type { Orden } from '@/mock/session';
import { resetSession, seedDemo, setSession, useSession } from '@/mock/session';
import { USUARIO_DEMO } from '@/mock/usuarios';
import { derivarEstado } from '@/lib/estado';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';

const ATAJOS = [
  { to: '/inicio', label: 'Inicio' },
  { to: '/bienvenida', label: 'Bienvenida' },
  { to: '/pago', label: 'Pago' },
  { to: '/perfil/completar', label: 'Completar perfil' },
  { to: '/coberturas', label: 'Coberturas' },
  { to: '/movimientos', label: 'Movimientos' },
  { to: '/planes', label: 'Planes' },
  { to: '/cuenta', label: 'Cuenta' },
];

/**
 * `PresetDemo` (mock/session.ts) solo cubre 2 de los 4 `EstadoCuenta`: esta
 * orden compone el tercero ("pagado, perfil sin completar") a mano con
 * `setSession`, sin agregar un preset nuevo al store.
 */
const ORDEN_PAGADA_DEMO: Orden = {
  id: 'demo-pagado-sin-perfil',
  fecha: '2026-09-01',
  tipo: 'plan',
  itemId: 'nexo-2',
  concepto: 'Nexo II · cuota mensual',
  monto: 12000,
  estado: 'pagada',
};

function activarPagadoSinPerfil(): void {
  setSession({
    usuario: USUARIO_DEMO,
    perfil: undefined,
    intent: { tipo: 'plan', id: 'nexo-2' },
    ordenes: [ORDEN_PAGADA_DEMO],
  });
}

export function Demo() {
  const sesion = useSession();
  const estado = derivarEstado(sesion);

  return (
    <div className="mx-auto max-w-[560px] px-4 py-10">
      <h1 className="text-2xl text-ink-950">Controles de demostración</h1>
      <p className="mt-1 text-sm text-ink-600">
        Atajos para la presentación. Esta pantalla no forma parte del producto.
      </p>

      <Card className="mt-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-ink-500">Estado actual</span>
          <Chip tono={estado === 'activo' ? 'ok' : estado === 'sinCuenta' ? 'neutro' : 'warn'}>{estado}</Chip>
        </div>

        <div className="flex flex-col gap-3">
          <Button variante="secundario" ancho="full" onClick={() => resetSession()}>
            Reiniciar
          </Button>
          <Button variante="secundario" ancho="full" onClick={() => seedDemo('nuevo-con-intent')}>
            Usuario nuevo con intención Nexo II
          </Button>
          <Button variante="secundario" ancho="full" onClick={activarPagadoSinPerfil}>
            Usuario pagado sin perfil
          </Button>
          <Button variante="secundario" ancho="full" onClick={() => seedDemo('activo')}>
            Usuario con Nexo II activo
          </Button>
        </div>
      </Card>

      <nav aria-label="Atajos de pantalla" className="mt-6">
        <h2 className="text-sm font-medium text-ink-500">Ir a</h2>
        <ul className="mt-2 flex flex-wrap gap-2">
          {ATAJOS.map((atajo) => (
            <li key={atajo.to}>
              <Link
                to={atajo.to}
                className="inline-flex rounded-pill border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-700 transition-colors duration-200 hover:border-ink-300 hover:text-ink-900"
              >
                {atajo.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
