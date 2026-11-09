import { useState } from 'react';
import { Link } from 'react-router';
import { ShieldCheck, UserPlus } from 'lucide-react';
import { setSession, useSession, type Beneficiario } from '@/mock/session';
import { planContratado } from '@/features/cobertura/contrataciones';
import { DialogoAgregarPersona } from '@/features/perfil/DialogoAgregarPersona';
import { Card } from '@/ui/Card';
import { EmptyState } from '@/ui/EmptyState';
import { clasesBoton } from '@/ui/Button';
import { cn } from '@/lib/cn';

const ETIQUETA_RELACION: Record<'conyuge' | 'hijo' | 'padre' | 'madre' | 'otro', string> = {
  conyuge: 'Cónyuge',
  hijo: 'Hijo/a',
  padre: 'Padre',
  madre: 'Madre',
  otro: 'Otro',
};

/**
 * Pantalla dedicada a adherentes del plan. Antes vivía como sección dentro de
 * /coberturas; se extrajo para que la gestión de familiares tenga su propio
 * menú y el usuario los pueda consultar/agregar sin pasar por cobertura.
 *
 * Con plan contratado: grid de cards (una por beneficiario del perfil) + card
 * dashed 'Agregar persona' al final.
 * Sin plan: EmptyState con CTA a /planes.
 */
export function Familiares() {
  const sesion = useSession();
  const plan = planContratado(sesion);
  const beneficiarios = sesion.perfil?.beneficiarios ?? [];
  const [agregandoPersona, setAgregandoPersona] = useState(false);

  if (!plan) {
    return (
      <div data-entrada className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl text-ink-950">Familiares</h1>
          <p className="mt-1 text-sm text-ink-600">Sumá adherentes al plan y gestionalos acá.</p>
        </div>
        <EmptyState
          icono={ShieldCheck}
          como="h2"
          titulo="Contratá un plan primero"
          descripcion="Para sumar adherentes necesitás tener un plan activo. Elegí uno y volvé a esta sección."
        >
          <Link to="/planes" className={clasesBoton({})}>
            Ver planes
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div data-entrada className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl text-ink-950">Familiares</h1>
        <p className="mt-1 text-sm text-ink-600">
          Adherentes al plan {plan.nombre}. Cargá sus datos una vez y acceden a las mismas prestaciones.
        </p>
      </div>

      <section aria-label="Lista de familiares" className={cn('flex flex-col gap-4')}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {beneficiarios.map((ben, i) => (
            <Card key={`${ben.numeroDocumento}-${i}`} className="flex items-center gap-3 p-4">
              <span
                aria-hidden="true"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-pill bg-marca-50 text-sm font-semibold text-marca-700"
              >
                {(ben.nombre[0] ?? '').toUpperCase()}
                {(ben.apellido[0] ?? '').toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-900">
                  {`${ben.nombre} ${ben.apellido}`.trim()}
                </p>
                <p className="text-xs text-ink-500">{ETIQUETA_RELACION[ben.relacion]}</p>
              </div>
            </Card>
          ))}

          {/* Card dashed de 'Agregar persona' siempre al final. Abre el mismo
              DialogoAgregarPersona que antes vivía en /coberturas. */}
          <button
            type="button"
            onClick={() => setAgregandoPersona(true)}
            className="flex cursor-pointer items-center gap-3 rounded-card border-2 border-dashed border-ink-200 bg-transparent p-4 text-left transition-colors hover:border-marca-400 hover:bg-marca-50/40"
          >
            <span
              aria-hidden="true"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-pill bg-marca-50 text-marca-600"
            >
              <UserPlus size={18} strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink-900">Agregar persona</p>
              <p className="text-xs text-ink-500">Sumá un adherente al plan</p>
            </div>
          </button>
        </div>
      </section>

      {agregandoPersona ? (
        <DialogoAgregarPersona
          onCerrar={() => setAgregandoPersona(false)}
          onAgregar={(beneficiario: Beneficiario) => {
            const perfilActual = sesion.perfil;
            if (perfilActual) {
              setSession({
                perfil: {
                  ...perfilActual,
                  beneficiarios: [...(perfilActual.beneficiarios ?? []), beneficiario],
                },
                familiares: (sesion.familiares ?? 0) + 1,
              });
            } else {
              setSession({ familiares: (sesion.familiares ?? 0) + 1 });
            }
            setAgregandoPersona(false);
          }}
        />
      ) : null}
    </div>
  );
}
