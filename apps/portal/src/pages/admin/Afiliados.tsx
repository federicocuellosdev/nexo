import { useCallback, useEffect, useState } from 'react';
import { Copy, Pencil, Plus, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { obtenerAfiliadosAdmin, type AfiliadoAdmin, type EstadoAfiliado } from '@/lib/api';
import { landingUrl } from '@/lib/urls';
import { Skeleton } from '@/ui/Skeleton';
import { Chip } from '@/ui/Chip';
import { Button } from '@/ui/Button';
import { EditarAfiliadoDialog } from '@/features/admin/EditarAfiliadoDialog';
import { AgregarAfiliadoDialog } from '@/features/admin/AgregarAfiliadoDialog';

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

/** URL de atribución: si alguien hace alta entrando por ella, el nuevo lead
 *  queda referenciado al afiliado. Usamos el id del lead como código — es
 *  único y ya lo tenemos. */
function urlAtribucion(afiliado: AfiliadoAdmin): string {
  return `${landingUrl()}/catalogo?ref=${afiliado.id}`;
}

const CHIP_POR_ESTADO: Record<EstadoAfiliado, { texto: string; tono: 'ok' | 'warn' | 'neutro' }> = {
  'con-cobertura': { texto: 'Con cobertura', tono: 'ok' },
  pagado: { texto: 'Falta perfil', tono: 'warn' },
  'sin-pagar': { texto: 'Sin pagar', tono: 'neutro' },
};

/** Botón para copiar al portapapeles con feedback visual de 1.5s. */
function BotonCopiar({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch (err) {
      console.warn('[copiar] no se pudo copiar al portapapeles', err);
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      aria-label={etiqueta}
      className="inline-flex size-8 cursor-pointer items-center justify-center rounded-pill text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
    >
      {copiado ? <Check size={16} className="text-ok-700" /> : <Copy size={16} />}
    </button>
  );
}

/**
 * Tabla de afiliados (todos los titulares, pagados o no). Cada fila expone:
 * nombre/apellido, DNI, email, plan, estado, URL de atribución (con copy) y
 * botón Editar que abre un dialog. Arriba a la derecha un botón "+" para
 * crear un afiliado nuevo.
 */
export function AdminAfiliados() {
  const [afiliados, setAfiliados] = useState<AfiliadoAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [editando, setEditando] = useState<AfiliadoAdmin | null>(null);
  const [agregando, setAgregando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(undefined);
    try {
      if (!supabase) throw new Error('supabase no configurado');
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('sesión expirada');
      const lista = await obtenerAfiliadosAdmin(token);
      setAfiliados(lista);
    } catch (err) {
      console.error('[AdminAfiliados] fetch error', err);
      setError('No pudimos cargar los afiliados');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <div data-entrada className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl text-ink-950">Afiliados</h1>
          <p className="mt-1 text-sm text-ink-600">Últimos 200 titulares, del más reciente al más viejo.</p>
        </div>
        <Button onClick={() => setAgregando(true)}>
          <Plus size={16} aria-hidden="true" />
          Agregar
        </Button>
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
          <p className="text-sm text-ink-600">Todavía no hay afiliados cargados.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-card bg-white shadow-card ring-1 ring-ink-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-100 text-left text-sm">
              <thead className="bg-ink-50 text-xs font-medium uppercase tracking-wide text-ink-500">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Afiliado
                  </th>
                  <th scope="col" className="px-4 py-3">
                    DNI
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Contacto
                  </th>
                  <th scope="col" className="px-4 py-3">
                    URL de afiliado
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Estado
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {afiliados.map((a) => {
                  const url = urlAtribucion(a);
                  const chip = CHIP_POR_ESTADO[a.estado];
                  return (
                    <tr key={a.id} className="hover:bg-ink-50/60">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink-900">{nombreCompleto(a)}</p>
                        <p className="text-xs text-ink-500">{formatearFecha(a.fechaAlta)}</p>
                      </td>
                      <td className="px-4 py-3 text-ink-700">{a.dni ?? '—'}</td>
                      <td className="px-4 py-3 text-ink-600">
                        <p className="truncate">{a.email}</p>
                        {a.telefono ? <p className="text-xs text-ink-500">{a.telefono}</p> : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <code className="truncate text-xs text-ink-600" title={url}>
                            {url.replace(/^https?:\/\//, '')}
                          </code>
                          <BotonCopiar valor={url} etiqueta={`Copiar URL de ${nombreCompleto(a)}`} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Chip tono={chip.tono}>{chip.texto}</Chip>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setEditando(a)}
                          aria-label={`Editar ${nombreCompleto(a)}`}
                          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-pill text-ink-500 transition-colors hover:bg-marca-50 hover:text-marca-700"
                        >
                          <Pencil size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editando ? (
        <EditarAfiliadoDialog
          afiliado={editando}
          onCerrar={() => setEditando(null)}
          onGuardado={() => {
            setEditando(null);
            void cargar();
          }}
        />
      ) : null}

      {agregando ? (
        <AgregarAfiliadoDialog
          onCerrar={() => setAgregando(false)}
          onCreado={() => {
            setAgregando(false);
            void cargar();
          }}
        />
      ) : null}
    </div>
  );
}
