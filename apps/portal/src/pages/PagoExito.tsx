import { Link } from 'react-router';
import { CircleCheck } from 'lucide-react';
import { useSession } from '@/mock/session';
import { clasesBoton } from '@/ui/Button';

export function PagoExito() {
  const sesion = useSession();
  const faltaPerfil = sesion.perfil === undefined;

  return (
    // Wrapper externo que ocupa el alto disponible y centra verticalmente.
    // `calc(100dvh-10rem)` descuenta el TopBar (~4rem) más el padding vertical
    // del `<main>` del PortalLayout (pb-24 + pt-6 ≈ 7.5rem en mobile). En
    // desktop sobra, pero el centrado flex sigue siendo el correcto. El `div`
    // interno mantiene el `max-w` y el centrado horizontal, así los botones
    // `w-full` siguen rindiendo todo el ancho de la columna.
    <div className="flex min-h-[calc(100dvh-10rem)] items-center justify-center">
      <div data-entrada className="mx-auto w-full max-w-[480px] text-center">
        <div className="flex justify-center">
          {/* `relative` porque la onda de celebración vive en el ::after de este
              mismo elemento (motion.css, `[data-celebrar]`). */}
          <span
            data-celebrar
            className="relative inline-flex size-20 items-center justify-center rounded-pill bg-ok-50 text-ok-700"
          >
            <CircleCheck size={36} strokeWidth={1.5} aria-hidden="true" />
          </span>
        </div>

        <h1 className="mt-6 text-2xl text-ink-950">¡Gracias por tu pago!</h1>

        {faltaPerfil ? (
          <>
            <p className="mt-3 text-base text-ink-600">
              Para activar tu cobertura, completá tu perfil. Son cuatro pasos cortos.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link to="/perfil/completar" className={clasesBoton({ tamano: 'lg', ancho: 'full' })}>
                Completar perfil
              </Link>
              <Link to="/inicio" className="text-sm font-medium text-marca-600 hover:text-marca-700">
                Ir al inicio
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="mt-3 text-base text-ink-600">Tu cobertura queda activa. Ya podés usarla.</p>
            <div className="mt-6">
              <Link to="/inicio" className={clasesBoton({ tamano: 'lg', ancho: 'full' })}>
                Ir al inicio
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
