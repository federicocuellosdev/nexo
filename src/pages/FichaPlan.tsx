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

export function FichaPlan() {
  const { slug } = useParams();
  const plan = buscarPlan(slug ?? '');
  const [abierto, setAbierto] = useState(false);

  if (!plan) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-16 lg:px-6">
        <EmptyState
          icono={SearchX}
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

  return (
    // pb-28 deja aire para el CTA fijo de mobile; en lg el CTA deja de ser fijo.
    <div className="mx-auto max-w-[720px] px-4 pb-28 pt-8 lg:px-6 lg:pb-16 lg:pt-12">
      <Link to="/catalogo" className="text-sm font-medium text-marca-600 hover:text-marca-700">
        ← Volver al catálogo
      </Link>

      <h1 className="mt-4 text-3xl text-ink-950">{plan.nombre}</h1>
      <p className="mt-2 text-base text-ink-600">{plan.bajada}</p>
      <div className="mt-4">
        <Money monto={plan.precio} periodo="por mes" tamano="lg" />
      </div>

      <section aria-label="Prestaciones del plan" className="mt-8">
        <h2 className="text-xl text-ink-950">Qué incluye</h2>
        <div className="mt-3 rounded-card bg-white px-4 shadow-card ring-1 ring-ink-100">
          <PlanPrestaciones prestaciones={plan.prestaciones} />
        </div>
      </section>

      <section aria-label="Comparación con los otros planes" className="mt-10">
        <h2 className="text-xl text-ink-950">Comparado con los otros planes</h2>
        <div className="mt-3">
          <PlanComparador actual={plan} otros={otros} />
        </div>
      </section>

      {/* CTA fijo inferior en mobile; estático desde lg. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink-100 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:static lg:mt-10 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <div className="mx-auto max-w-[720px]">
          <Button ancho="full" tamano="lg" onClick={() => setAbierto(true)}>
            {`Contratar ${plan.nombre}`}
          </Button>
        </div>
      </div>

      <AltaDialog
        abierto={abierto}
        onCambio={setAbierto}
        item={{ tipo: 'plan', id: plan.slug, nombre: plan.nombre, precio: plan.precio }}
      />
    </div>
  );
}
