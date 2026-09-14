import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { SearchX } from 'lucide-react';
import { buscarPlan, PLANES } from '@/mock/planes';
import { PlanPrestaciones } from '@/features/planes/PlanPrestaciones';
import { PlanComparador } from '@/features/planes/PlanComparador';
import { AltaDialog } from '@/features/alta/AltaDialog';
import { Money } from '@/ui/Money';
import { Button, clasesBoton } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { BarraAccionFija } from '@/ui/BarraAccionFija';
import { Revelar } from '@/ui/Revelar';
import { EncabezadoSeccion } from '@/ui/EncabezadoSeccion';
import type { PlanSlug } from '@/mock/planes';
import heroNexo1 from '@/assets/hero-woman-3.webp';
import heroNexo2 from '@/assets/hero-woman-2.webp';
import heroNexo3 from '@/assets/banner-comunidad-2.webp';

/**
 * Foto de portada por plan. Vive acá y NO en `mock/planes.ts` a propósito: ese
 * archivo lo compara byte a byte el test de paridad del repo hermano
 * (`nexo-3.0-portal/src/mock/planes.paridad.test.ts`), así que agregarle un
 * campo `imagen` rompería el portal. Además la foto es una decisión de esta
 * landing, no un dato del producto.
 *
 * El `alt` describe la escena y no repite el nombre del plan: el `<h1>` que va
 * encima ya lo dice, y duplicarlo obliga al lector de pantalla a oírlo dos veces.
 */
const PORTADA: Record<PlanSlug, { src: string; alt: string }> = {
  'nexo-1': { src: heroNexo1, alt: 'Una pareja corriendo al aire libre entre jacarandás en flor' },
  'nexo-2': { src: heroNexo2, alt: 'Un grupo de amigos sentados en el pasto de un parque, riéndose' },
  'nexo-3': { src: heroNexo3, alt: 'Un grupo de amigos en un living, mirando juntos la pantalla de un celular' },
};

export function FichaPlan() {
  const { slug } = useParams();
  const plan = buscarPlan(slug ?? '');
  const [abierto, setAbierto] = useState(false);

  if (!plan) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-16 lg:px-6">
        <EmptyState
          icono={SearchX}
          como="h1"
          titulo="No encontramos ese plan"
          descripcion="Puede que el enlace esté viejo o que el plan ya no esté disponible."
        >
          <Link to="/catalogo" className={clasesBoton({ variante: 'secundario' })}>
            Ver el catálogo
          </Link>
        </EmptyState>
      </div>
    );
  }

  const otros = PLANES.filter((otro) => otro.slug !== plan.slug);
  const portada = PORTADA[plan.slug];

  return (
    <>
      {/* Portada a sangre. El nombre del plan va ENCIMA de la foto, no debajo:
          es lo que convierte la ficha en una portada y no en un panel de datos.
          `object-position` alto deja la escena visible aunque el recorte sea
          agresivo en pantallas anchas y bajas. */}
      <section className="relative isolate flex min-h-[52svh] items-end overflow-hidden bg-ink-950 lg:min-h-[58svh]">
        <img
          src={portada.src}
          alt={portada.alt}
          loading="eager"
          fetchPriority="high"
          data-parallax
          className="absolute inset-0 -z-10 size-full object-cover object-[50%_35%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/60 to-ink-950/10"
        />
        <div data-entrada className="mx-auto w-full max-w-[1200px] px-4 pt-24 pb-12 lg:px-8 lg:pb-16">
          <Link
            to="/catalogo"
            className="text-xs font-semibold tracking-[0.08em] text-white/80 uppercase hover:text-white"
          >
            ← Volver al catálogo
          </Link>
          <p className="mt-6 font-display text-lg text-marca-100 italic lg:text-xl">(Plan mensual)</p>
          <h1 className="mt-2 font-display text-4xl text-white italic lg:text-5xl">{plan.nombre}</h1>
          <p className="mt-4 max-w-[46ch] text-lg text-white/85">{plan.bajada}</p>
          {/* El precio vive en la portada y no debajo: suelto en la columna de
              lectura quedaba huérfano en un hueco, y acá completa la unidad
              "qué es / qué cuesta" de un vistazo. */}
          <div className="mt-6">
            <Money monto={plan.precio} periodo="por mes" tamano="lg" tono="claro" />
          </div>
        </div>
      </section>

      {/* Es una superficie de LECTURA: la medida angosta (760px ≈ 75 caracteres)
          se conserva a propósito, no se ensancha a 1200 como la home.
          pb-28 deja lugar al CTA fijo de mobile; en lg el CTA deja de ser fijo. */}
      <div className="mx-auto max-w-[760px] px-4 pt-16 pb-28 lg:px-8 lg:pt-24 lg:pb-24">
        <section aria-label="Prestaciones del plan">
          <Revelar>
            <EncabezadoSeccion titulo="Qué incluye" tamano="medio" />
          </Revelar>
          <Revelar className="mt-6 rounded-card bg-white px-4 shadow-card ring-1 ring-ink-100">
            <PlanPrestaciones prestaciones={plan.prestaciones} />
          </Revelar>
        </section>

        <section aria-label="Comparación con los otros planes" className="mt-20">
          <Revelar>
            <EncabezadoSeccion titulo="Comparado con los otros planes" tamano="medio" />
          </Revelar>
          <Revelar className="mt-6">
            <PlanComparador actual={plan} otros={otros} />
          </Revelar>
        </section>

        {/* CTA fijo inferior en mobile; estático desde lg. */}
        <BarraAccionFija>
          <Button ancho="full" tamano="lg" onClick={() => setAbierto(true)}>
            {`Contratar ${plan.nombre}`}
          </Button>
        </BarraAccionFija>

        <AltaDialog
          abierto={abierto}
          onCambio={setAbierto}
          item={{
            tipo: 'plan',
            id: plan.slug,
            nombre: plan.nombre,
            precio: plan.precio,
            pendiente: plan.prestaciones.some((p) => p.pendiente),
          }}
        />
      </div>
    </>
  );
}
