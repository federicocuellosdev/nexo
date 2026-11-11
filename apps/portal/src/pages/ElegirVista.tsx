import { useNavigate } from 'react-router';
import { ShieldCheck, LayoutDashboard } from 'lucide-react';
import { useSession } from '@/mock/session';
import { LogoNexo, ETIQUETA_MARCA } from '@/ui/LogoNexo';

/**
 * Selector de vista cliente/admin. Solo entra acá quien en /me/roles vino
 * con `['cliente', 'admin']`. Si tenía un solo rol, AuthCallback lo mandó
 * directo. La elección NO se persiste: el admin puede volver a esta pantalla
 * en cualquier momento con /elegir-vista para cambiar de modo.
 */
export function ElegirVista() {
  const navegar = useNavigate();
  const sesion = useSession();
  const nombre = sesion.usuario?.nombre?.trim() ?? '';

  return (
    <div data-entrada className="flex min-h-dvh flex-col bg-app">
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-3 px-4 lg:h-16 lg:px-8">
          <span aria-label={ETIQUETA_MARCA} className="inline-flex items-center">
            <LogoNexo alto={22} etiqueta={null} />
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[960px] px-4 py-16 lg:px-8 lg:py-24">
        <div className="text-center">
          <h1 className="font-display text-3xl text-ink-950 italic lg:text-4xl">
            {nombre ? `Hola, ${nombre}` : 'Hola'}
          </h1>
          <p className="mt-3 text-base text-ink-600">Elegí con qué vista querés entrar.</p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => navegar('/inicio')}
            className="group flex flex-col items-start gap-5 rounded-card bg-white p-6 text-left shadow-card ring-1 ring-ink-100 transition-all hover:ring-marca-500 motion-safe:hover:-translate-y-0.5 lg:p-8"
          >
            <span
              aria-hidden="true"
              className="inline-flex size-12 items-center justify-center rounded-pill bg-marca-50 text-marca-700"
            >
              <ShieldCheck size={24} strokeWidth={1.75} />
            </span>
            <div>
              <h2 className="font-display text-xl text-ink-950">Vista cliente</h2>
              <p className="mt-2 text-sm text-ink-600">
                Tu cobertura, credencial, movimientos y familiares. Lo mismo que ven los afiliados.
              </p>
            </div>
            <span className="mt-auto text-sm font-medium text-marca-600 group-hover:text-marca-700">
              Entrar →
            </span>
          </button>

          <button
            type="button"
            onClick={() => navegar('/admin/dashboard')}
            className="group flex flex-col items-start gap-5 rounded-card bg-brand-oscurecido p-6 text-left text-white shadow-elevada ring-1 ring-marca-300 transition-all motion-safe:hover:-translate-y-0.5 lg:p-8"
          >
            <span
              aria-hidden="true"
              className="inline-flex size-12 items-center justify-center rounded-pill bg-white/15 text-white ring-1 ring-white/30"
            >
              <LayoutDashboard size={24} strokeWidth={1.75} />
            </span>
            <div>
              <h2 className="font-display text-xl text-white">Vista administrador</h2>
              <p className="mt-2 text-sm text-white/85">
                Dashboard de leads y afiliados, métricas del funnel y gestión de altas.
              </p>
            </div>
            <span className="mt-auto text-sm font-medium text-white">Entrar →</span>
          </button>
        </div>
      </main>
    </div>
  );
}
