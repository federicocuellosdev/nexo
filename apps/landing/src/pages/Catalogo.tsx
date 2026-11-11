import { useNavigate } from 'react-router';
import { PLANES } from '@/mock/planes';
import { PlanCard } from '@/features/planes/PlanCard';
import { Revelar } from '@/ui/Revelar';
import { EncabezadoSeccion } from '@/ui/EncabezadoSeccion';

/**
 * Catálogo de planes. Producción publica un único plan (Previnca Nexo), así
 * que renderizamos una sola card centrada en vez del grid de 3 columnas +
 * tabs + PlanComparador que teníamos cuando había Nexo I/II/III. El CTA
 * navega a `/contratar/plan/:slug` donde vive el wizard full-screen de alta.
 */
export function Catalogo() {
  const navegar = useNavigate();

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-5 pb-20 lg:px-8 lg:pt-12 lg:pb-28">
      <Revelar>
        <EncabezadoSeccion eyebrow="Todo junto" titulo="Catálogo" como="h1" />
      </Revelar>
      <Revelar>
        <p className="mt-6 max-w-[52ch] text-base text-ink-600 text-pretty">
          Un plan mensual que te cubre lo esencial: emergencias, odontología, farmacia y teleconsultas DOC24.
        </p>
      </Revelar>

      {/* Divisor tenue que cierra el bloque de encabezado y separa la
          introducción de la card del plan. Alcanza el ancho completo del
          contenedor para que haga de "fin del header". */}
      <hr className="mt-10 border-0 border-t border-ink-200" aria-hidden="true" />

      {/* Card única: cap en 520px para que no se estire al ancho del main
          cuando hay un solo plan. Centrada con mx-auto. */}
      <div className="mt-12 flex justify-center">
        <div className="w-full max-w-[520px]">
          {PLANES.map((plan) => (
            <Revelar key={plan.slug}>
              <PlanCard
                plan={plan}
                destacado={plan.recomendado === true}
                onCta={(p) => navegar(`/contratar/plan/${p.slug}`)}
                etiquetaCta="Contratar"
                className="!bg-white"
              />
            </Revelar>
          ))}
        </div>
      </div>
    </div>
  );
}
