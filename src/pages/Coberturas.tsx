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
      <div className="flex flex-col gap-8">
        <div>
          {/*
            El h1 de la página se conserva también en el camino vacío: EmptyState
            usa un h3 como único heading, y sin este h1 el documento arrancaría
            directo en h3 (mismo patrón ya correcto en Inicio.tsx y Planes.tsx).
            Acá es el caso más frecuente: dispara para sinCuenta y
            conCuentaSinPago, los dos estados más comunes de un visitante nuevo.
          */}
          <h1 className="text-2xl text-ink-950">Mis coberturas</h1>
          <p className="mt-1 text-sm text-ink-600">Lo que tenés contratado y cómo usarlo.</p>
        </div>
        <EmptyState
          icono={ShieldCheck}
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
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl text-ink-950">Mis coberturas</h1>
        <p className="mt-1 text-sm text-ink-600">Lo que tenés contratado y cómo usarlo.</p>
      </div>

      {plan ? (
        <section aria-label="Plan contratado">
          <Card className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Icon icono={ShieldCheck} tono="marca" />
                <div className="min-w-0">
                  <h2 className="font-display text-xl text-ink-950">{plan.nombre}</h2>
                  {vencimiento ? (
                    <p className="text-sm text-ink-500">{`Próxima cuota: ${vencimiento}`}</p>
                  ) : null}
                </div>
              </div>
              <CoberturaEstado estado={estado} />
            </div>

            <Money monto={plan.precio} periodo="por mes" tamano="lg" />

            {estado === 'pagadoSinPerfil' ? (
              <div className="rounded-campo bg-warn-50 p-3">
                <p className="text-sm text-warn-700">
                  Tu cobertura está pendiente de activación: falta completar el perfil.
                </p>
                <Link
                  to="/perfil/completar"
                  className={clasesBoton({ tamano: 'sm', ancho: 'full', className: 'mt-3' })}
                >
                  Completar perfil
                </Link>
              </div>
            ) : null}

            <div className="border-t border-ink-100 pt-1">
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
