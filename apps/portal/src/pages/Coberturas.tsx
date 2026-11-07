import { useState } from 'react';
import { Link } from 'react-router';
import { ChevronDown, CircleAlert, Glasses, ShieldCheck, Stethoscope } from 'lucide-react';
import { useSession } from '@/mock/session';
import { derivarEstado } from '@/lib/estado';
import {
  planContratado,
  productosContratados,
  proximoVencimiento,
} from '@/features/cobertura/contrataciones';
import { CoberturaEstado } from '@/features/cobertura/CoberturaEstado';
import { PlanPrestaciones } from '@/features/planes/PlanPrestaciones';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { Money } from '@/ui/Money';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { clasesBoton } from '@/ui/Button';

const COMO_USARLA = [
  {
    id: 'optica',
    icono: Glasses,
    titulo: 'Óptica',
    texto:
      'Presentá tu credencial y la receta en cualquier sucursal de Rosario Visión, con la cuota al día. Retirás un par al año: armazón y cristales de stock. Lo que exceda la cobertura lo abonás con 20 % de descuento.',
  },
  {
    id: 'doc24',
    icono: Stethoscope,
    titulo: 'Telemedicina Doc24',
    texto:
      'Entrás a la app de Doc24 con tu email y pedís consulta clínica sin turno previo. La primera consulta del mes va sin cargo según tu plan; el resto tiene coseguro.',
  },
];

export function Coberturas() {
  const sesion = useSession();
  const estado = derivarEstado(sesion);
  const plan = planContratado(sesion);
  const productos = productosContratados(sesion);
  const vencimiento = proximoVencimiento(sesion);
  const [prestacionesAbierto, setPrestacionesAbierto] = useState(false);

  function mostrarPrestaciones() {
    setPrestacionesAbierto(true);
    // Mismo scroll-to que el ancla, pero suave y después de que React
    // renderice el panel abierto.
    requestAnimationFrame(() => {
      document.getElementById('prestaciones')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (plan === undefined && productos.length === 0) {
    return (
      <div data-entrada className="flex flex-col gap-8">
        <div>
          {/*
            El h1 de la pantalla se conserva también en el camino vacío: es el
            título de la página, no un parche. Dispara para sinCuenta y
            conCuentaSinPago, los dos estados más comunes de un visitante nuevo.
          */}
          <h1 className="text-2xl text-ink-950">Mis coberturas</h1>
          <p className="mt-1 text-sm text-ink-600">Lo que tenés contratado y cómo usarlo.</p>
        </div>
        <EmptyState
          icono={ShieldCheck}
          // h2 y no el h3 por defecto: cuelga directo del h1 de la pantalla,
          // sin ningún encabezado intermedio. Antes saltaba de h1 a h3.
          como="h2"
          titulo="Todavía no tenés coberturas"
          descripcion="Cuando contrates un plan lo vas a ver acá con todas sus prestaciones."
        >
          <Link to="/planes" className={clasesBoton({})}>
            Ver planes
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div data-entrada className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl text-ink-950">Mis coberturas</h1>
        <p className="mt-1 text-sm text-ink-600">Lo que tenés contratado y cómo usarlo.</p>
      </div>

      {plan ? (
        <section aria-label="Plan contratado" className="flex flex-col gap-4">
          <Card className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Izq: identificación + precio + estado del plan. En desktop crece,
                en mobile va arriba y los CTAs se apilan debajo. */}
            <div className="flex min-w-0 items-center gap-4">
              <Icon icono={ShieldCheck} tono="marca" tamano="lg" />
              <div className="flex min-w-0 flex-col gap-1">
                <h2 className="font-display text-xl text-ink-950">{plan.nombre}</h2>
                {vencimiento ? (
                  <p className="text-sm text-ink-500">{`Próxima cuota: ${vencimiento}`}</p>
                ) : null}
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <Money monto={plan.precio} periodo="por mes" />
                  <CoberturaEstado estado={estado} />
                </div>
              </div>
            </div>

            {/* Der: acciones. Con perfil pendiente el único CTA posible es
                completarlo — "Ver prestaciones" y "Contratar servicios" no
                tienen sentido mientras la cobertura no esté activa. */}
            <div className="flex flex-col gap-2 lg:basis-2/5 lg:shrink-0">
              {estado === 'pagadoSinPerfil' ? (
                <Link to="/perfil/completar" className={clasesBoton({ ancho: 'full', tamano: 'lg' })}>
                  Completar perfil
                </Link>
              ) : (
                <>
                  <button type="button" onClick={mostrarPrestaciones} className={clasesBoton({ ancho: 'full' })}>
                    Ver prestaciones
                  </button>
                  <Link to="/planes" className={clasesBoton({ variante: 'secundario', ancho: 'full' })}>
                    Contratar servicios
                  </Link>
                </>
              )}
            </div>
          </Card>

          <section id="prestaciones" aria-label={`Coberturas del plan ${plan.nombre}`} className="scroll-mt-6">
            <Card className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => setPrestacionesAbierto((abierto) => !abierto)}
                aria-expanded={prestacionesAbierto}
                aria-controls="prestaciones-detalle"
                className="flex items-center justify-between gap-3 text-left"
              >
                <span className="text-base font-medium text-ink-900">{`Coberturas del plan ${plan.nombre}`}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={`size-5 text-ink-500 transition-transform duration-200 ${
                    prestacionesAbierto ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {prestacionesAbierto ? (
                <div id="prestaciones-detalle" className="border-t border-ink-100 pt-4">
                  <PlanPrestaciones prestaciones={plan.prestaciones} />
                </div>
              ) : null}
            </Card>
          </section>
        </section>
      ) : null}

      {productos.length > 0 ? (
        <section aria-label="Productos contratados">
          <h2 className="mb-3 text-xl text-ink-950">Productos contratados</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {productos.map((producto) => (
              <Card key={producto.id} className="flex flex-col gap-2">
                <h3 className="text-base font-medium text-ink-950">{producto.nombre}</h3>
                <p className="text-sm text-ink-600">{producto.detalle}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Money monto={producto.precio} periodo="por mes" />
                  {producto.pendiente ? (
                    <Chip tono="warn" icono={CircleAlert}>
                      a confirmar
                    </Chip>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-label="Cómo usar tu cobertura">
        <h2 className="mb-3 text-xl text-ink-950">Cómo usar tu cobertura</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {COMO_USARLA.map((item) => (
            <Card key={item.id} className="flex flex-col gap-3">
              <Icon icono={item.icono} tono="marca" />
              <h3 className="text-base font-medium text-ink-950">{item.titulo}</h3>
              <p className="text-sm text-ink-600">{item.texto}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
