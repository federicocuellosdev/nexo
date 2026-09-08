import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { parsearCallback } from '@/lib/callback';
import { getSession, setSession } from '@/mock/session';
import { Skeleton } from '@/ui/Skeleton';

/** Espera simulada de validación del token (spec §6). */
const MS_VALIDACION = 600;

export function AuthCallback() {
  const { search } = useLocation();
  const navegar = useNavigate();

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      const datos = parsearCallback(search);

      if (datos === null) {
        void navegar('/ingresar', { replace: true });
        return;
      }

      if (datos.intent === 'alta') {
        setSession({
          usuario: datos.usuario,
          intent: { tipo: datos.tipo, id: datos.id },
        });
        void navegar('/bienvenida', { replace: true });
        return;
      }

      // Login: si ya había un usuario con ese email, se conserva su nombre real
      // en vez de pisarlo con campos vacíos (el enlace de login solo trae email).
      const previo = getSession().usuario;
      const usuario =
        previo !== undefined && previo.email === datos.email
          ? previo
          : { nombre: '', apellido: '', email: datos.email, telefono: '' };

      setSession({ usuario });
      void navegar('/inicio', { replace: true });
    }, MS_VALIDACION);

    return () => {
      window.clearTimeout(temporizador);
    };
  }, [search, navegar]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-[420px] flex-col justify-center px-4">
      <p role="status" className="text-center text-base text-ink-700">
        Validando tu enlace…
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-3/4" />
        <Skeleton className="h-11 w-1/2" />
      </div>
    </div>
  );
}
