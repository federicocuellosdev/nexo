import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { parsearCallback } from '@/lib/callback';
import { supabase } from '@/lib/supabase';
import { getSession, setSession } from '@/mock/session';
import { Skeleton } from '@/ui/Skeleton';
import { LogoNexo } from '@/ui/LogoNexo';

/** Espera simulada de validación del token (spec §6). */
const MS_VALIDACION = 600;

export function AuthCallback() {
  const { search, hash } = useLocation();
  const navegar = useNavigate();

  useEffect(() => {
    // Rama real: magic link de Supabase. Viene como hash fragment
    // (#access_token=...&refresh_token=...). Supabase SDK ya intercambió el
    // token cuando se montó el módulo (detectSessionInUrl: true), así que
    // acá solo preguntamos la sesión resultante.
    //
    // El `leadId` viaja como query param del redirectTo que seteó el server
    // (ver apps/api/src/routes/leads.ts). Lo usamos para ligar al usuario
    // recién autenticado con su lead en v3.leads.
    if (supabase && (hash.includes('access_token') || hash.includes('error'))) {
      void (async () => {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          console.error('[auth/callback] magic link inválido o expirado', error);
          void navegar('/ingresar', { replace: true });
          return;
        }

        const parametros = new URLSearchParams(search);
        const leadId = parametros.get('leadId') ?? undefined;
        const email = data.session.user.email ?? '';

        const previo = getSession().usuario;
        const usuario =
          previo !== undefined && previo.email === email
            ? previo
            : {
                nombre: data.session.user.user_metadata?.nombre ?? '',
                apellido: data.session.user.user_metadata?.apellido ?? '',
                email,
                telefono: '',
              };

        setSession({
          usuario,
          ...(leadId ? { intent: { tipo: 'plan', id: leadId } } : {}),
        });
        // Hard navigate para que Supabase limpie el hash del URL — el
        // router mantendría el hash en el history.
        window.location.replace('/bienvenida');
      })();
      return;
    }

    // Rama legacy: demo / handoff mock (token=demo + query params). Se mantiene
    // para que los tests existentes y la ruta /demo sigan funcionando mientras
    // haya consumidores que no pasan por Supabase.
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
  }, [search, hash, navegar]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-[420px] flex-col justify-center px-4">
      {/* Misma razón que en /ingresar: esta pantalla vive fuera de PortalLayout
          y se llega a ella desde un enlace de mail. Sin marca, medio segundo de
          "Validando tu enlace…" sobre fondo gris no dice a dónde se llegó. */}
      <div className="mb-8 flex justify-center">
        <LogoNexo alto={26} etiqueta={null} />
      </div>

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
