import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase browser-side. Usa el ANON key, público por diseño: RLS
 * controla qué puede ver cada usuario. `detectSessionInUrl: true` hace que al
 * cargar la página del callback, el SDK lea el `#access_token` del hash,
 * intercambie por sesión y limpie la URL automáticamente. `persistSession`
 * guarda el token en `localStorage` así el usuario sigue logueado al recargar.
 *
 * Si las env vars no están configuradas (ej. dev local sin Supabase), caemos
 * a null y el `AuthCallback` se degrada al flow mock de demo. Así el repo
 * sigue siendo clonable sin credenciales para onboarding de devs.
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'implicit',
        },
      })
    : null;

export function supabaseConfigurado(): boolean {
  return supabase !== null;
}
