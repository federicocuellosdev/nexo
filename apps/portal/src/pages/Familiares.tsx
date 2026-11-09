import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ShieldCheck, UserPlus } from 'lucide-react';
import { setSession, useSession, type Beneficiario } from '@/mock/session';
import { planContratado } from '@/features/cobertura/contrataciones';
import { DialogoAgregarVariasPersonas } from '@/features/perfil/DialogoAgregarVariasPersonas';
import { DialogoEmailMercadoPago } from '@/features/pago/DialogoEmailMercadoPago';
import { crearSuscripcion } from '@/lib/api';
import { Card } from '@/ui/Card';
import { EmptyState } from '@/ui/EmptyState';
import { clasesBoton } from '@/ui/Button';

const ETIQUETA_RELACION: Record<'conyuge' | 'hijo' | 'padre' | 'madre' | 'otro', string> = {
  conyuge: 'Cónyuge',
  hijo: 'Hijo/a',
  padre: 'Padre',
  madre: 'Madre',
  otro: 'Otro',
};

export function Familiares() {
  const sesion = useSession();
  const navegar = useNavigate();
  const plan = planContratado(sesion);
  const beneficiarios = sesion.perfil?.beneficiarios ?? [];
  const [agregando, setAgregando] = useState(false);
  // Cuando el user completa el wizard sin emailPago en sesión, retenemos los
  // beneficiarios nuevos acá para disparar el pago en cuanto el popup de MP
  // nos devuelva el email.
  const [pendientes, setPendientes] = useState<Beneficiario[] | null>(null);

  async function crearSuscripcionPorAdherentes(nuevos: Beneficiario[], emailMp: string) {
    if (!plan) return;
    const monto = plan.precio * nuevos.length;
    try {
      const { preapprovalId, initPoint } = await crearSuscripcion({
        planId: plan.slug,
        planNombre: `${plan.nombre} · ${nuevos.length} adherente(s)`,
        monto,
        emailMp,
      });
      window.open(initPoint, '_blank', 'noopener,noreferrer');
      // Persistir los beneficiarios + bumpar familiares. El pago no está
      // confirmado todavía — el polling de /pago (que escucha pagoPendiente)
      // transiciona a 'authorized' cuando MP confirma.
      const perfilActual = sesion.perfil;
      if (perfilActual) {
        setSession({
          perfil: {
            ...perfilActual,
            beneficiarios: [...(perfilActual.beneficiarios ?? []), ...nuevos],
          },
          familiares: (sesion.familiares ?? 0) + nuevos.length,
          emailPago: emailMp,
          pagoPendiente: {
            preapprovalId,
            tipo: 'plan',
            itemId: plan.slug,
            nombre: `${plan.nombre} · ${nuevos.length} adherente(s)`,
            monto,
            emailMp,
            checkoutUrl: initPoint,
          },
        });
      } else {
        setSession({
          familiares: (sesion.familiares ?? 0) + nuevos.length,
          emailPago: emailMp,
          pagoPendiente: {
            preapprovalId,
            tipo: 'plan',
            itemId: plan.slug,
            nombre: `${plan.nombre} · ${nuevos.length} adherente(s)`,
            monto,
            emailMp,
            checkoutUrl: initPoint,
          },
        });
      }
      void navegar('/pago');
    } catch (err) {
      console.warn('[familiares] no se pudo crear la suscripcion, cayendo al mock', err);
      void navegar('/pago');
    }
  }

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

      <section aria-label="Lista de familiares" className="flex flex-col gap-4">
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

          <button
            type="button"
            onClick={() => setAgregando(true)}
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
              <p className="text-xs text-ink-500">Sumá uno o varios adherentes</p>
            </div>
          </button>
        </div>
      </section>

      {agregando ? (
        <DialogoAgregarVariasPersonas
          precioPorPersona={plan.precio}
          onCerrar={() => setAgregando(false)}
          onFinalizar={(nuevos) => {
            setAgregando(false);
            const emailMp = sesion.emailPago;
            if (emailMp) {
              void crearSuscripcionPorAdherentes(nuevos, emailMp);
            } else {
              // Necesitamos pedir el email MP antes de crear la preapproval.
              // Retenemos los beneficiarios y abrimos el popup correspondiente.
              setPendientes(nuevos);
            }
          }}
        />
      ) : null}

      {pendientes ? (
        <DialogoEmailMercadoPago
          onCerrar={() => setPendientes(null)}
          onConfirmar={(email) => {
            const nuevos = pendientes;
            setPendientes(null);
            if (nuevos) void crearSuscripcionPorAdherentes(nuevos, email);
          }}
        />
      ) : null}
    </div>
  );
}
