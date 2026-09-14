import { Link } from 'react-router';
import { CircleCheck } from 'lucide-react';
import { useSession } from '@/mock/session';
import { clasesBoton } from '@/ui/Button';

export function PagoExito() {
  const sesion = useSession();
  const faltaPerfil = sesion.perfil === undefined;

  return (
    <div data-entrada className="mx-auto max-w-[480px] text-center">
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
  );
}
