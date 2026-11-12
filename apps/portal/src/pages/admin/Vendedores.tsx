import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Copy, Plus, Check, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { obtenerVendedoresAdmin, type VendedorAdmin } from '@/lib/api';
import { landingUrl } from '@/lib/urls';
import { Skeleton } from '@/ui/Skeleton';
import { AgregarVendedorDialog } from '@/features/admin/AgregarVendedorDialog';
import { FichaVendedor } from '@/features/admin/FichaVendedor';

function nombreCompleto(v: VendedorAdmin): string {
  return `${v.nombre} ${v.apellido}`.trim();
}

/** URL de atribución: si alguien hace alta entrando por ella, la venta
 *  queda referenciada a este vendedor. */
function urlAtribucion(vendedor: VendedorAdmin): string {
  // Usamos el código corto (6 chars) en lugar del UUID para que la URL sea
  // compartible por WhatsApp / impresa en material físico. El backend
  // resuelve el código → UUID en el POST /leads.
  return `${landingUrl()}/onboarding?ref=${vendedor.codigo_corto}`;
}

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
 * Tabla de vendedores (partners del programa de ventas). Cada fila es una
 * línea sola con: nombre, DNI, email, teléfono, etiqueta, URL de atribución
 * y acciones. Arriba a la derecha el botón '+' para agregar uno nuevo.
 */
export function AdminVendedores() {
  const [vendedores, setVendedores] = useState<VendedorAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [agregando, setAgregando] = useState(false);
  const [viendo, setViendo] = useState<VendedorAdmin | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(undefined);
    try {
      if (!supabase) throw new Error('supabase no configurado');
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('sesión expirada');
      const lista = await obtenerVendedoresAdmin(token);
      setVendedores(lista);
    } catch (err) {
      console.error('[AdminVendedores] fetch error', err);
      setError('No pudimos cargar los vendedores');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Apertura por deep link `/admin/vendedores?ver=UUID`. Lo usa FichaLead
  // para saltar desde la ficha de un lead a la de su vendedor atribuido.
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    const verId = params.get('ver');
    if (!verId) return;
    const match = vendedores.find((v) => v.id === verId);
    if (match) {
      setViendo(match);
      params.delete('ver');
      setParams(params, { replace: true });
    }
  }, [vendedores, params, setParams]);

  if (viendo) {
    return <FichaVendedor vendedorId={viendo.id} onVolver={() => setViendo(null)} />;
  }

  return (
    <div data-entrada className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl text-ink-950">Vendedores</h1>
          <p className="mt-1 text-sm text-ink-600">
            Partners del programa de ventas. Cada uno tiene una URL para atribuirse las ventas que genere.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAgregando(true)}
          aria-label="Agregar vendedor"
          className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-pill bg-marca-600 text-white shadow-suave transition-colors duration-200 ease-out-expo hover:bg-marca-700 motion-safe:active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-500"
        >
          <Plus size={20} aria-hidden="true" />
        </button>
      </div>

      {error ? (
        <p role="alert" className="rounded-card bg-danger-50 px-4 py-3 text-sm text-danger-700 ring-1 ring-danger-500/30">
          {error}
        </p>
      ) : null}

      {cargando ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : vendedores.length === 0 ? (
        <div className="rounded-card bg-white px-6 py-12 text-center shadow-card ring-1 ring-ink-100">
          <p className="text-sm text-ink-600">Todavía no hay vendedores cargados.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-card bg-white shadow-card ring-1 ring-ink-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-100 text-left text-sm">
              <thead className="bg-ink-50 text-xs font-medium uppercase tracking-wide text-ink-500">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Nombre
                  </th>
                  <th scope="col" className="px-4 py-3">
                    DNI
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Etiqueta
                  </th>
                  <th scope="col" className="px-4 py-3">
                    URL de vendedor
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {vendedores.map((v) => {
                  const url = urlAtribucion(v);
                  const nombre = nombreCompleto(v);
                  return (
                    <tr key={v.id} className="hover:bg-ink-50/60">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-ink-900">{nombre}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink-700">{v.dni ?? '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {v.etiqueta ? (
                          <span className="inline-flex items-center rounded-pill bg-marca-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-marca-700">
                            {v.etiqueta}
                          </span>
                        ) : (
                          <span className="text-ink-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <code
                            className="font-mono text-xs text-ink-700"
                            title={url}
                          >
                            /onboarding?ref={v.codigo_corto}
                          </code>
                          <BotonCopiar valor={url} etiqueta={`Copiar URL de ${nombre}`} />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setViendo(v)}
                          aria-label={`Ver ficha de ${nombre}`}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-pill bg-marca-50 px-3 py-1 text-xs font-medium text-marca-700 transition-colors hover:bg-marca-100"
                        >
                          <Eye size={12} />
                          Ver
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

      {agregando ? (
        <AgregarVendedorDialog
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
