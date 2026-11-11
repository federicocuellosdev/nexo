import { useNavigate } from 'react-router';
import { ShieldCheck, LayoutDashboard, Home } from 'lucide-react';
import { LogoNexo, ETIQUETA_MARCA } from '@/ui/LogoNexo';
import { clasesBoton } from '@/ui/Button';

/**
 * Selector de vista cliente/admin. Solo entra acá quien en /me/roles vino
 * con `['cliente', 'admin']`. La elección NO se persiste: el admin puede
 * volver a esta pantalla desde el sidebar admin con "Cambiar de vista".
 *
 * Header propio con logo + CTA a /inicio: /elegir-vista vive FUERA de
 * PortalLayout, así que no hereda la sidebar. El CTA a Inicio da salida
 * rápida sin forzar elegir una vista si alguien entró de curioso.
 */
export function ElegirVista() {
  const navegar = useNavigate();

  return (
    <div data-entrada className="flex min-h-dvh flex-col bg-app">
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-3 px-4 lg:h-16 lg:px-8">
          <button
            type="button"
            onClick={() => navegar('/inicio')}
            aria-label={ETIQUETA_MARCA}
            className="inline-flex items-center"
          >
            <LogoNexo alto={22} etiqueta={null} />
          </button>
          <button
            type="button"
            onClick={() => navegar('/inicio')}
            className={clasesBoton({ variante: 'secundario', tamano: 'sm' })}
          >
            <Home size={16} aria-hidden="true" />
            Ir a inicio
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[960px] flex-1 px-4 py-16 lg:px-8 lg:py-24">
        <div className="text-center">
          <h1 className="font-display text-3xl text-ink-950 italic lg:text-4xl">¿Qué vista?</h1>
          <p className="mt-3 text-base text-ink-600">
            Seleccioná la vista con la que querés entrar al portal.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => navegar('/inicio')}
            className="group flex cursor-pointer flex-col items-start gap-5 rounded-card bg-white p-6 text-left shadow-card ring-1 ring-ink-100 transition-all hover:ring-marca-500 motion-safe:hover:-translate-y-0.5 lg:p-8"
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
            className="group flex cursor-pointer flex-col items-start gap-5 rounded-card bg-brand-oscurecido p-6 text-left text-white shadow-elevada ring-1 ring-marca-300 transition-all motion-safe:hover:-translate-y-0.5 lg:p-8"
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
