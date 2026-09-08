import { Link } from 'react-router';
import { ChevronDown, CreditCard, MousePointerClick, UserPlus } from 'lucide-react';
import { ON_DEMAND, PLANES } from '@/mock/planes';
import { FAQ } from '@/mock/faq';
import { formatearPrecio, precioDesde } from '@/lib/formato';
import { PlanCard } from '@/features/planes/PlanCard';
import { ProductoCard } from '@/features/planes/ProductoCard';
import { clasesBoton } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { Card } from '@/ui/Card';
import heroWoman from '@/assets/hero-woman.webp';
import fotoComunidad from '@/assets/banner-comunidad-1.webp';
import fotoTelemedicina from '@/assets/carta-telemedicina.webp';

const PASOS = [
  { icono: MousePointerClick, titulo: 'Elegís', texto: 'Comparás los planes y te quedás con el que te sirve.' },
  { icono: UserPlus, titulo: 'Te registrás', texto: 'Nombre, apellido, email y teléfono. Sin contraseñas.' },
  { icono: CreditCard, titulo: 'Pagás y listo', texto: 'Abonás la primera cuota y tu cobertura queda activa.' },
];

/**
 * Pill con puntito de color, mayúsculas y tracking amplio para los CTA
 * SECUNDARIOS de sección ("Ver el catálogo completo", "Ver todos los
 * productos"). El CTA primario (Button `variante="primario"`) no lleva este
 * tratamiento: sigue siendo el único lugar con el degradado de marca.
 */
const ENLACE_SECUNDARIO =
  'inline-flex items-center gap-2 rounded-pill border border-ink-200 bg-white px-4 py-2 text-xs font-semibold tracking-[0.08em] text-ink-700 uppercase transition-colors duration-200 ease-out-quart hover:border-marca-300 hover:text-marca-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-500';

interface EncabezadoSeccionProps {
  /** Va entre paréntesis, en serif itálica chica (kicker de sección). */
  eyebrow: string;
  titulo: string;
}

/**
 * Eyebrow itálico entre paréntesis + título grande en DM Serif Display
 * itálica: el contraste serif/sans es lo que separa esta sección de un
 * bloque más de la landing. Se repite en las 4 secciones de abajo (Cómo
 * funciona, Nuestros planes, Productos on demand, Preguntas frecuentes),
 * así que vive acá en vez de copiada 4 veces.
 */
function EncabezadoSeccion({ eyebrow, titulo }: EncabezadoSeccionProps) {
  return (
    <div>
      <p className="font-display text-lg text-marca-500 italic lg:text-xl">({eyebrow})</p>
      <h2 className="mt-2 max-w-[20ch] font-display text-3xl text-ink-950 italic lg:text-4xl">{titulo}</h2>
    </div>
  );
}

export function Home() {
  const desde = precioDesde(PLANES);

  return (
    <>
      {/* Hero — foto full-bleed con scrim oscuro para que el título en blanco
          tenga contraste AA encima. `object-position` deja a la persona y el
          celular (el sujeto de la foto) visibles incluso recortados en 390 px. */}
      <section className="relative isolate flex min-h-[560px] items-end overflow-hidden bg-ink-950 lg:min-h-[640px]">
        <img
          src={heroWoman}
          alt="Mujer sonriendo mientras mira la app de Nexo en su celular, sentada en el living de su casa"
          loading="eager"
          fetchPriority="high"
          className="absolute inset-0 -z-10 size-full object-cover object-[75%_22%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/60 to-ink-950/10"
        />
        <div className="mx-auto w-full max-w-[1100px] px-4 pt-28 pb-12 lg:px-6 lg:pt-32 lg:pb-20">
          <p className="font-display text-lg text-marca-100 italic lg:text-xl">(Previnca Salud)</p>
          <h1 className="mt-3 max-w-[16ch] text-3xl text-white lg:text-[3.25rem] lg:leading-[1.05]">
            Tu salud, resuelta desde el celular
          </h1>
          <p className="mt-4 max-w-[46ch] text-base text-white/80 lg:text-lg">
            {/* Telemedicina (Doc24 · Clínica) es la única prestación en los TRES
                planes (src/mock/planes.ts): emergencias, farmacia, guardia
                odontológica y óptica varían según cuál elijas, así que acá no se
                promete el combo completo para cualquier plan. */}
            Telemedicina en los tres planes, más emergencias, guardia odontológica, farmacia u óptica según el que
            elijas — todo en una cuota mensual que contratás en minutos.
          </p>
          <p className="mt-6 text-lg text-white">
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
        </div>
      </section>

      {/* Cómo funciona — bg blanco (alterna con el app-tone de las otras
          secciones). Composición de fotos en par (grande + chica desplazada,
          ambas rounded-card) junto a los 3 pasos, en vez de una grilla pareja. */}
      <section aria-label="Cómo funciona" className="bg-white">
        <div className="mx-auto max-w-[1100px] px-4 py-16 lg:px-6 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div className="lg:order-2">
              <EncabezadoSeccion eyebrow="Así de fácil" titulo="Cómo funciona" />
              <ol className="mt-8 flex flex-col gap-4">
                {PASOS.map((paso, indice) => (
                  <li key={paso.titulo}>
                    <Card className="flex items-start gap-4 transition-shadow duration-200 ease-out-quart hover:shadow-elevada">
                      <Icon icono={paso.icono} tono="marca" />
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-ink-500">Paso {indice + 1}</span>
                        <h3 className="text-lg font-medium text-ink-950">{paso.titulo}</h3>
                        <p className="text-sm text-ink-600">{paso.texto}</p>
                      </div>
                    </Card>
                  </li>
                ))}
              </ol>
            </div>

            <div className="relative ml-4 lg:order-1 lg:ml-0">
              <img
                src={fotoComunidad}
                alt="Grupo de amigos sonriendo mientras miran juntos el celular de uno de ellos"
                loading="eager"
                fetchPriority="low"
                className="aspect-[4/5] w-full rounded-card object-cover shadow-card"
              />
              <img
                src={fotoTelemedicina}
                alt="Mujer haciendo una videollamada de telemedicina con una doctora desde su notebook"
                loading="eager"
                fetchPriority="low"
                className="absolute -bottom-6 -left-4 aspect-[3/4] w-2/5 rounded-card object-cover shadow-elevada ring-4 ring-white lg:-bottom-10 lg:-left-10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Planes — sin bg propio: deja ver el app-tone (marca-50/#f6f5fb) de
          PublicLayout, alternando con el blanco de arriba y abajo. Motivo
          decorativo: un círculo grande y pálido en marca-100 (el mismo
          "punto" de marca de "nexo."), sin blur (evita el bug conocido de
          iOS Safari con fondos difusos en mobile). */}
      <section aria-label="Nuestros planes" className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 size-[420px] rounded-full bg-marca-100/70 lg:size-[560px]"
        />
        <div className="relative mx-auto max-w-[1100px] px-4 py-16 lg:px-6 lg:py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <EncabezadoSeccion eyebrow="Elegí el tuyo" titulo="Nuestros planes" />
            <Link to="/catalogo" className={ENLACE_SECUNDARIO}>
              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-marca-500" />
              Ver el catálogo completo
            </Link>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PLANES.map((plan) => (
              <PlanCard
                key={plan.slug}
                plan={plan}
                destacado={plan.recomendado === true}
                hrefDetalle={`/planes/${plan.slug}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* On demand — bg blanco, vuelve a alternar. */}
      <section aria-label="Productos on demand" className="bg-white">
        <div className="mx-auto max-w-[1100px] px-4 py-16 lg:px-6 lg:py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <EncabezadoSeccion eyebrow="Cuando los necesites" titulo="Productos on demand" />
            <Link to="/catalogo?tab=productos" className={ENLACE_SECUNDARIO}>
              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-marca-500" />
              Ver todos los productos
            </Link>
          </div>
          <p className="mt-3 max-w-[52ch] text-sm text-ink-600">
            Coberturas que se suman aparte de la cuota. Requieren un plan activo.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ON_DEMAND.map((producto) => (
              <ProductoCard key={producto.id} producto={producto} hrefDetalle={`/productos/${producto.id}`} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — `<details>` nativo: teclado, buscador del navegador y cero JS.
          Sin bg propio: vuelve a alternar con el app-tone. */}
      <section aria-label="Preguntas frecuentes">
        <div className="mx-auto max-w-[720px] px-4 py-16 lg:px-6 lg:py-24">
          <EncabezadoSeccion eyebrow="Todo lo que preguntan" titulo="Preguntas frecuentes" />
          <div className="mt-8 flex flex-col gap-3">
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
                <div className="mt-2 flex flex-col gap-2 text-sm text-ink-600">
                  {item.respuesta.split('\n').map((parrafo, indice) => (
                    // Los párrafos son posicionales y pueden repetirse entre sí
                    // (dos oraciones idénticas en una misma respuesta): la key
                    // va por índice, no por contenido.
                    <p key={indice}>{parrafo}</p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
