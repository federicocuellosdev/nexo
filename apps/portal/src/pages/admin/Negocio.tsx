import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { obtenerLeadsAdmin, esAfiliado, type LeadResumenAdmin } from '@/lib/api';
import { Skeleton } from '@/ui/Skeleton';
import { Chip } from '@/ui/Chip';
import { Tabs, TabPanel, type ItemTab } from '@/ui/Tabs';
import { FichaLeadDialog } from '@/features/admin/FichaLeadDialog';

type Pestana = 'afiliados' | 'leads';

const ITEMS: ItemTab<Pestana>[] = [
  { valor: 'afiliados', label: 'Afiliados' },
  { valor: 'leads', label: 'Leads' },
];

function nombreCompleto(l: LeadResumenAdmin): string {
  return `${l.nombre ?? ''} ${l.apellido ?? ''}`.trim() || l.email;
}

function formatearFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso.slice(0, 10);
  }
}

/**
 * Sección "Negocio" del admin. Dos tablas con el mismo backing data
 * (v3.leads) splittea por estado:
 *  - Afiliados: pagaron + perfil completo (DNI + fecha nac).
 *  - Leads: todo el resto del funnel (incluye los sin pagar y los
 *    pagados sin perfil).
 * Click en una fila → dialog con la ficha detallada.
 */
export function AdminNegocio() {
  const [pestana, setPestana] = useState<Pestana>('afiliados');
  const [leads, setLeads] = useState<LeadResumenAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [seleccionado, setSeleccionado] = useState<LeadResumenAdmin | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(undefined);
    try {
      if (!supabase) throw new Error('supabase no configurado');
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('sesión expirada');
      const lista = await obtenerLeadsAdmin(token);
      setLeads(lista);
    } catch (err) {
      console.error('[AdminNegocio] fetch error', err);
      setError('No pudimos cargar los datos.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const { afiliados, enFunnel } = useMemo(() => {
    const afi: LeadResumenAdmin[] = [];
    const fun: LeadResumenAdmin[] = [];
    for (const l of leads) {
      if (esAfiliado(l)) afi.push(l);
      else fun.push(l);
    }
    return { afiliados: afi, enFunnel: fun };
  }, [leads]);

  return (
    <div data-entrada className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl text-ink-950">Negocio</h1>
        <p className="mt-1 text-sm text-ink-600">
          Afiliados con cobertura activa y leads en el funnel. Click en una fila para ver la ficha.
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded-card bg-danger-50 px-4 py-3 text-sm text-danger-700 ring-1 ring-danger-500/30">
          {error}
        </p>
      ) : null}

      <Tabs valor={pestana} onCambio={setPestana} items={ITEMS} etiqueta="Negocio">
        <TabPanel<Pestana> valor="afiliados">
          {cargando ? <SkeletonTabla /> : <Tabla lista={afiliados} vacio="Todavía no hay afiliados con cobertura activa." modo="afiliado" onAbrir={setSeleccionado} />}
        </TabPanel>
        <TabPanel<Pestana> valor="leads">
          {cargando ? <SkeletonTabla /> : <Tabla lista={enFunnel} vacio="No hay leads en el funnel." modo="lead" onAbrir={setSeleccionado} />}
        </TabPanel>
      </Tabs>

      {seleccionado ? (
        <FichaLeadDialog
          leadId={seleccionado.id}
          nombre={nombreCompleto(seleccionado)}
          descripcion={seleccionado.email}
          onCerrar={() => setSeleccionado(null)}
        />
      ) : null}
    </div>
  );
}

interface TablaProps {
  lista: LeadResumenAdmin[];
  vacio: string;
  modo: 'afiliado' | 'lead';
  onAbrir: (l: LeadResumenAdmin) => void;
}

function Tabla({ lista, vacio, modo, onAbrir }: TablaProps) {
  if (lista.length === 0) {
    return (
      <div className="rounded-card bg-white px-6 py-12 text-center shadow-card ring-1 ring-ink-100">
        <p className="text-sm text-ink-600">{vacio}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card bg-white shadow-card ring-1 ring-ink-100">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-ink-100 text-left text-sm">
          <thead className="bg-ink-50 text-xs font-medium uppercase tracking-wide text-ink-500">
            <tr>
              <th scope="col" className="px-4 py-3">Nombre</th>
              <th scope="col" className="px-4 py-3">DNI</th>
              <th scope="col" className="px-4 py-3">Email</th>
              <th scope="col" className="px-4 py-3">Plan</th>
              <th scope="col" className="px-4 py-3">{modo === 'afiliado' ? 'Alta' : 'Estado'}</th>
              <th scope="col" className="px-4 py-3 text-right">Ficha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {lista.map((l) => {
              const nombre = `${l.nombre ?? ''} ${l.apellido ?? ''}`.trim() || l.email;
              return (
                <tr
                  key={l.id}
                  className="cursor-pointer hover:bg-ink-50/60"
                  onClick={() => onAbrir(l)}
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-ink-900">{nombre}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-700">{l.dni ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-700">{l.email}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-700">{l.item_nombre ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {modo === 'afiliado' ? (
                      <span className="text-ink-700">{formatearFecha(l.created_at)}</span>
                    ) : l.mp_status === 'authorized' ? (
                      <Chip tono="warn">Pagó · falta perfil</Chip>
                    ) : (
                      <Chip tono="neutro">Sin pagar</Chip>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAbrir(l);
                      }}
                      aria-label={`Ver ficha de ${nombre}`}
                      className="inline-flex size-8 cursor-pointer items-center justify-center rounded-pill text-ink-500 transition-colors hover:bg-marca-50 hover:text-marca-700"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SkeletonTabla() {
  return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
