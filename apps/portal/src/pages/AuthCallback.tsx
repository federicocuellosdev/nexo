import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { parsearCallback } from '@/lib/callback';
import { supabase } from '@/lib/supabase';
import { obtenerMisRoles } from '@/lib/api';
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
    // Query params del `redirectTo` que armó el server (ver apps/api/src/routes/leads.ts):
    //  - `leadId`:   UUID del lead en v3.leads. Por ahora no se guarda en la sesión,
    //                está disponible por si el portal necesita referenciarlo en /enrich.
    //  - `planTipo`: 'plan' | 'producto'.
    //  - `planId`:   slug del item (ej. 'nexo-1'). Es lo que buscarPlan/buscarProducto
    //                necesitan para renderizar coberturas y precio en /inicio.
    if (supabase && (hash.includes('access_token') || hash.includes('error'))) {
      void (async () => {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          console.error('[auth/callback] magic link inválido o expirado', error);
          void navegar('/ingresar', { replace: true });
          return;
        }

        const parametros = new URLSearchParams(search);
        const planId = parametros.get('planId') ?? undefined;
        const planTipoRaw = parametros.get('planTipo');
        const planTipo: 'plan' | 'producto' | undefined =
          planTipoRaw === 'plan' || planTipoRaw === 'producto' ? planTipoRaw : undefined;
        const leadId = parametros.get('leadId') ?? undefined;
        const email = data.session.user.email ?? '';
        const meta = data.session.user.user_metadata ?? {};
        const nombreMeta = typeof meta.nombre === 'string' ? meta.nombre : '';
        const apellidoMeta = typeof meta.apellido === 'string' ? meta.apellido : '';
        const telefonoMeta = typeof meta.telefono === 'string' ? meta.telefono : '';
        const dniMeta = typeof meta.dni === 'string' ? meta.dni : undefined;

        // Reglas de merge del usuario:
        //   - Si no hay previo o cambio el email → armamos uno desde cero con
        //     lo que venga en user_metadata.
        //   - Si hay previo mismo email → lo conservamos pero "upgradeamos"
        //     nombre/apellido/telefono cuando el previo los tiene vacios y el
        //     metadata los trae con valor. Esto cierra el caso de la sesion
        //     vieja sin esos datos que no se hidrataba porque el `previo`
        //     ganaba por default.
        const previo = getSession().usuario;
        let usuario: ReturnType<typeof getSession>['usuario'];
        if (previo !== undefined && previo.email === email) {
          const nombreVacio = (previo.nombre ?? '').trim() === '';
          const apellidoVacio = (previo.apellido ?? '').trim() === '';
          const telefonoVacio = (previo.telefono ?? '').trim() === '';
          usuario = {
            ...previo,
            ...(nombreVacio && nombreMeta ? { nombre: nombreMeta } : {}),
            ...(apellidoVacio && apellidoMeta ? { apellido: apellidoMeta } : {}),
            ...(telefonoVacio && telefonoMeta ? { telefono: telefonoMeta } : {}),
          };
        } else {
          usuario = {
            nombre: nombreMeta,
            apellido: apellidoMeta,
            email,
            telefono: telefonoMeta,
          };
        }

        const dniPrevio = getSession().dniLead;
        setSession({
          usuario,
          ...(planId && planTipo ? { intent: { tipo: planTipo, id: planId } } : {}),
          ...(leadId ? { leadId } : {}),
          ...(dniPrevio === undefined && dniMeta ? { dniLead: dniMeta } : {}),
        });

        // Resolver ruta destino según roles. El selector `/elegir-vista`
        // aparece cuando el usuario tiene 2+ roles con panel propio
        // (cliente, admin, vendedor). Si vino con `?destino=` en el
        // redirectTo del magic link (usado por el email del vendedor), lo
        // respetamos directo. Si /me/roles falla caemos a /inicio.
        const paramsRedirect = new URLSearchParams(window.location.search);
        const destinoDirecto = paramsRedirect.get('destino');
        let destino = destinoDirecto ? destinoDirecto.replace(/^\//, '') : 'inicio';
        if (!destinoDirecto) {
          try {
            const token = data.session.access_token;
            const roles = await obtenerMisRoles(token);
            const esAdmin = roles.includes('admin');
            const esCliente = roles.includes('cliente');
            const esVendedor = roles.includes('vendedor');
            const rolesConPanel = [esAdmin, esCliente, esVendedor].filter(Boolean).length;
            if (rolesConPanel >= 2) destino = 'elegir-vista';
            else if (esAdmin) destino = 'admin/dashboard';
            else if (esVendedor) destino = 'vendedor/dashboard';
            else destino = 'inicio';
          } catch (err) {
            console.warn('[auth/callback] no se pudo leer roles, caigo a /inicio', err);
          }
        }

        // Hard navigate para que Supabase limpie el hash del URL.
        window.location.replace(`${import.meta.env.BASE_URL}${destino}`);
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
