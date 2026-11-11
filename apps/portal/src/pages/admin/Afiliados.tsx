import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { obtenerAfiliadosAdmin, type AfiliadoAdmin } from '@/lib/api';
import { Skeleton } from '@/ui/Skeleton';
import { Chip } from '@/ui/Chip';

function formatearFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso.slice(0, 10);
  }
}

function nombreCompleto(a: AfiliadoAdmin): string {
  return `${a.nombre ?? ''} ${a.apellido ?? ''}`.trim() || a.email;
}

/**
 * Tabla de afiliados (titulares con pago autorizado). Muestra los últimos 200.
 * Chip "Con cobertura" verde para los que completaron el perfil, "Falta perfil"
 * amarillo para los que pagaron pero no cargaron DNI/fecha nacimiento.
 */
export function AdminAfiliados() {
  const [afiliados, setAfiliados] = useState<AfiliadoAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelado = false;
    void (async () => {
      try {
        if (!supabase) {
          setError('Supabase no configurado');
          return;
        }
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          setError('Sesión expirada');
          return;
        }
        const lista = await obtenerAfiliadosAdmin(token);
        if (!cancelado) setAfiliados(lista);
      } catch (err) {
        console.error('[AdminAfiliados] fetch error', err);
        if (!cancelado) setError('No pudimos cargar los afiliados');
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <div data-entrada className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl text-ink-950">Afiliados</h1>
        <p className="mt-1 text-sm text-ink-600">
          Titulares con pago autorizado — últimos 200, del más reciente al más viejo.
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded-card bg-danger-50 px-4 py-3 text-sm text-danger-700 ring-1 ring-danger-500/30">
          {error}
        </p>
      ) : null}

      {cargando ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : afiliados.length === 0 ? (
        <div className="rounded-card bg-white px-6 py-12 text-center shadow-card ring-1 ring-ink-100">
          <p className="text-sm text-ink-600">Todavía no hay afiliados con pago autorizado.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-card bg-white shadow-card ring-1 ring-ink-100">
          {/* Desktop: tabla real. Mobile: lista stacked via CSS (cada <tr>
              pasa a display:block). Hoy mantengo la tabla simple; cuando
              crezca la lista se agrega el stacked layout con @media. */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-100 text-left text-sm">
              <thead className="bg-ink-50 text-xs font-medium uppercase tracking-wide text-ink-500">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Afiliado
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Contacto
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Plan
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Alta
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {afiliados.map((a) => (
                  <tr key={a.id} className="hover:bg-ink-50/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-900">{nombreCompleto(a)}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      <p className="truncate">{a.email}</p>
                      {a.telefono ? <p className="text-xs text-ink-500">{a.telefono}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-ink-700">{a.plan ?? '—'}</td>
                    <td className="px-4 py-3 text-ink-700">{formatearFecha(a.fechaAlta)}</td>
                    <td className="px-4 py-3">
                      {a.conCobertura ? (
                        <Chip tono="ok">Con cobertura</Chip>
                      ) : (
                        <Chip tono="warn">Falta perfil</Chip>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
