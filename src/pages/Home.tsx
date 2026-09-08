import { Link } from 'react-router';
import { ChevronDown, CreditCard, MousePointerClick, UserPlus } from 'lucide-react';
import { ON_DEMAND, PLANES } from '@/mock/planes';
import { formatearPrecio, precioDesde } from '@/lib/formato';
import { PlanCard } from '@/features/planes/PlanCard';
import { ProductoCard } from '@/features/planes/ProductoCard';
import { clasesBoton } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { Card } from '@/ui/Card';

const PASOS = [
  { icono: MousePointerClick, titulo: 'Elegís', texto: 'Comparás los planes y te quedás con el que te sirve.' },
  { icono: UserPlus, titulo: 'Te registrás', texto: 'Nombre, apellido, email y teléfono. Sin contraseñas.' },
  { icono: CreditCard, titulo: 'Pagás y listo', texto: 'Abonás la primera cuota y tu cobertura queda activa.' },
];

const FAQ = [
  {
    pregunta: '¿Cuándo empieza a valer la cobertura?',
    respuesta:
      'Apenas se acredita el primer pago y completás tu perfil. En la maqueta el pago es simulado, así que es inmediato.',
  },
  {
    pregunta: '¿Necesito obra social o prepaga?',
    respuesta:
      'No. Nexo es complementario: podés tenerlo con obra social o sin ella. Te lo preguntamos solo para conocerte mejor.',
  },
  {
    pregunta: '¿Puedo cambiar de plan más adelante?',
    respuesta: 'Sí. Desde el portal elegís otro plan y el cambio se aplica en la cuota siguiente.',
  },
  {
    pregunta: '¿Qué son los servicios on demand?',
    respuesta:
      'Coberturas que se contratan aparte de la cuota mensual, como el Seguro de Hogar. Requieren un plan activo.',
  },
];

export function Home() {
  const desde = precioDesde(PLANES);

  return (
    <>
      {/* Hero — 390 px primero: una columna, CTA de ancho completo. */}
      <section className="mx-auto max-w-[1100px] px-4 pb-12 pt-10 lg:px-6 lg:pb-20 lg:pt-16">
        <p className="text-sm font-medium text-marca-600">Previnca Salud</p>
        <h1 className="mt-3 max-w-[16ch] text-3xl text-ink-950 lg:text-[3.25rem] lg:leading-[1.05]">
          Tu salud, resuelta desde el celular
        </h1>
        <p className="mt-4 max-w-[46ch] text-base text-ink-600 lg:text-lg">
          Emergencias, farmacia, óptica y telemedicina en un plan mensual que contratás en minutos.
        </p>
        <p className="mt-6 text-lg text-ink-900">
          Planes <strong className="font-semibold">desde {formatearPrecio(desde)} por mes</strong>
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link to="/catalogo" className={clasesBoton({ tamano: 'lg', ancho: 'full', className: 'sm:w-auto' })}>
            Ver planes
          </Link>
          <Link
            to="/catalogo?tab=productos"
            className={clasesBoton({
              variante: 'secundario',
              tamano: 'lg',
              ancho: 'full',
              className: 'sm:w-auto',
            })}
          >
            Ver productos
          </Link>
        </div>
      </section>

      {/* Cómo funciona */}
      <section aria-label="Cómo funciona" className="mx-auto max-w-[1100px] px-4 py-10 lg:px-6 lg:py-14">
        <h2 className="text-2xl text-ink-950">Cómo funciona</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {PASOS.map((paso, indice) => (
            <li key={paso.titulo}>
              <Card className="flex h-full flex-col gap-3 transition-shadow duration-200 ease-out-quart hover:shadow-elevada">
                <div className="flex items-center gap-3">
                  <Icon icono={paso.icono} tono="marca" />
                  <span className="text-sm font-medium text-ink-500">Paso {indice + 1}</span>
                </div>
                <h3 className="text-lg font-medium text-ink-950">{paso.titulo}</h3>
                <p className="text-sm text-ink-600">{paso.texto}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* Planes */}
      <section aria-label="Nuestros planes" className="mx-auto max-w-[1100px] px-4 py-10 lg:px-6 lg:py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl text-ink-950">Nuestros planes</h2>
          <Link to="/catalogo" className="text-sm font-medium text-marca-600 hover:text-marca-700">
            Ver el catálogo completo
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {PLANES.map((plan) => (
            <PlanCard
              key={plan.slug}
              plan={plan}
              destacado={plan.recomendado === true}
              hrefDetalle={`/planes/${plan.slug}`}
            />
          ))}
        </div>
      </section>

      {/* On demand */}
      <section aria-label="Productos on demand" className="mx-auto max-w-[1100px] px-4 py-10 lg:px-6 lg:py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl text-ink-950">Productos on demand</h2>
          <Link to="/catalogo?tab=productos" className="text-sm font-medium text-marca-600 hover:text-marca-700">
            Ver todos los productos
          </Link>
        </div>
        <p className="mt-2 max-w-[52ch] text-sm text-ink-600">
          Coberturas que se suman aparte de la cuota. Requieren un plan activo.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ON_DEMAND.map((producto) => (
            <ProductoCard key={producto.id} producto={producto} hrefDetalle={`/productos/${producto.id}`} />
          ))}
        </div>
      </section>

      {/* FAQ — `<details>` nativo: teclado, buscador del navegador y cero JS. */}
      <section aria-label="Preguntas frecuentes" className="mx-auto max-w-[720px] px-4 py-10 lg:px-6 lg:py-14">
        <h2 className="text-2xl text-ink-950">Preguntas frecuentes</h2>
        <div className="mt-6 flex flex-col gap-3">
          {FAQ.map((item) => (
            <details
              key={item.pregunta}
              className="group rounded-card bg-white px-5 py-4 shadow-suave ring-1 ring-ink-100"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-medium text-ink-900 marker:content-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-500">
                {item.pregunta}
                <ChevronDown
                  size={18}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className="shrink-0 text-ink-400 transition-transform duration-200 ease-out-quart group-open:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <p className="mt-2 text-sm text-ink-600">{item.respuesta}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
