import { Link } from 'react-router';
import { CircleAlert, Glasses, ShieldCheck, Stethoscope } from 'lucide-react';
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
        <section aria-label="Plan contratado">
          {/* Header del plan + prestaciones DENTRO de la misma Card. Antes
              había dos Cards (identificación arriba, collapsible de
              prestaciones abajo) + un botón "Ver prestaciones" que las
              expandía. Se unificó: la cobertura es información de referencia,
              esconderla atrás de un toggle hace que el usuario tenga que
              clickear para ver lo mismo que ya vino a buscar. */}
          <Card className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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

              {/* Con perfil pendiente el único CTA posible es completarlo.
                  Con cobertura activa, ofrecer contratar servicios extra. */}
              <div className="flex flex-col gap-2 lg:basis-2/5 lg:shrink-0">
                {estado === 'pagadoSinPerfil' ? (
                  <Link to="/perfil/completar" className={clasesBoton({ ancho: 'full', tamano: 'lg' })}>
                    Completar perfil
                  </Link>
                ) : (
                  <Link to="/planes" className={clasesBoton({ variante: 'secundario', ancho: 'full' })}>
                    Contratar servicios
                  </Link>
                )}
              </div>
            </div>

            <div className="border-t border-ink-100 pt-5">
              <h3 className="mb-3 text-base font-medium text-ink-900">{`Coberturas del plan ${plan.nombre}`}</h3>
              <PlanPrestaciones prestaciones={plan.prestaciones} />
            </div>
          </Card>
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
