import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { supabase } from '@/lib/supabase';
import { obtenerLeadsAdmin, esAfiliado, type LeadResumenAdmin } from '@/lib/api';
import { Skeleton } from '@/ui/Skeleton';
import { Chip } from '@/ui/Chip';
import { Input } from '@/ui/Input';
import { Field } from '@/ui/Field';
import { Tabs, TabPanel, type ItemTab } from '@/ui/Tabs';
import { FichaLead } from '@/features/admin/FichaLead';

type Pestana = 'afiliados' | 'leads';
type Rango = '7' | '14' | '30' | 'mes' | 'personalizado' | 'todo';

const ITEMS: ItemTab<Pestana>[] = [
  { valor: 'afiliados', label: 'Afiliados' },
  { valor: 'leads', label: 'Leads' },
];

const OPCIONES_RANGO: Array<{ valor: Rango; label: string }> = [
  { valor: 'mes', label: 'Este mes' },
  { valor: '7', label: '7 días' },
  { valor: '14', label: '14 días' },
  { valor: '30', label: '30 días' },
  { valor: 'personalizado', label: 'Personalizado' },
  { valor: 'todo', label: 'Todo' },
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

/** Convierte `YYYY-MM-DD` del <input type="date"> a timestamp UTC al inicio
 *  del día (desde) o al final (hasta). Null si el string es inválido. */
function isoAStart(iso: string): number | null {
  if (!iso) return null;
  const t = new Date(`${iso}T00:00:00`).getTime();
  return Number.isNaN(t) ? null : t;
}
function isoAEnd(iso: string): number | null {
  if (!iso) return null;
  const t = new Date(`${iso}T23:59:59.999`).getTime();
  return Number.isNaN(t) ? null : t;
}

/** Deriva {desde, hasta} (timestamps) del rango seleccionado. Null =
 *  sin cota en ese extremo. */
function resolverRango(rango: Rango, desdeInput: string, hastaInput: string): { desde: number | null; hasta: number | null } {
  const ahora = Date.now();
  if (rango === 'todo') return { desde: null, hasta: null };
  if (rango === 'personalizado') return { desde: isoAStart(desdeInput), hasta: isoAEnd(hastaInput) };
  if (rango === 'mes') {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1).getTime();
    return { desde: primerDia, hasta: null };
  }
  const dias = parseInt(rango, 10);
  return { desde: ahora - dias * 24 * 60 * 60 * 1000, hasta: null };
}

function filtrar(lista: LeadResumenAdmin[], busqueda: string, desde: number | null, hasta: number | null): LeadResumenAdmin[] {
  const q = busqueda.trim().toLowerCase();
  return lista.filter((l) => {
    const t = new Date(l.created_at).getTime();
    if (desde !== null && t < desde) return false;
    if (hasta !== null && t > hasta) return false;
    if (q === '') return true;
    const hay =
      (l.nombre ?? '').toLowerCase().includes(q) ||
      (l.apellido ?? '').toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      (l.dni ?? '').toLowerCase().includes(q);
    return hay;
  });
}

/**
 * Sección "Negocio" del admin. Dos tablas con el mismo backing data
 * (v3.leads) splittea por estado. Con buscador por nombre/email/DNI y
 * filtro por rango de fecha de alta. Click en "Ver" abre la ficha
 * inline reemplazando el listado.
 */
export function AdminNegocio() {
  const [pestana, setPestana] = useState<Pestana>('afiliados');
  const [leads, setLeads] = useState<LeadResumenAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [seleccionado, setSeleccionado] = useState<LeadResumenAdmin | null>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [rango, setRango] = useState<Rango>('mes');
  const [desdeCustom, setDesdeCustom] = useState('');
  const [hastaCustom, setHastaCustom] = useState('');

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
    const { desde, hasta } = resolverRango(rango, desdeCustom, hastaCustom);
    const afi: LeadResumenAdmin[] = [];
    const fun: LeadResumenAdmin[] = [];
    for (const l of filtrar(leads, busqueda, desde, hasta)) {
      if (esAfiliado(l)) afi.push(l);
      else fun.push(l);
    }
    return { afiliados: afi, enFunnel: fun };
  }, [leads, busqueda, rango, desdeCustom, hastaCustom]);

  // Vista ficha: full-section, sin tabla ni filtros.
  if (seleccionado) {
    return (
      <FichaLead
        leadId={seleccionado.id}
        nombre={nombreCompleto(seleccionado)}
        descripcion={seleccionado.email}
        onVolver={() => setSeleccionado(null)}
      />
    );
  }

  return (
    <div data-entrada className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl text-ink-950">Negocio</h1>
        <p className="mt-1 text-sm text-ink-600">
          Afiliados con cobertura activa y leads en el funnel. Click en "Ver" para abrir la ficha.
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded-card bg-danger-50 px-4 py-3 text-sm text-danger-700 ring-1 ring-danger-500/30">
          {error}
        </p>
      ) : null}

      {/* Buscador + rango temporal en la misma fila. En viewport angosto
          los filtros bajan a su propia línea con wrap. El search tiene
          max-width para no inflarse y empujar los filtros. */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] max-w-xs flex-1">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-500"
          />
          <Input
            id="neg-buscar"
            type="search"
            placeholder="Buscar por nombre, email o DNI…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10"
            style={{ borderRadius: 100 }}
          />
          {busqueda ? (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-pill text-ink-500 hover:bg-ink-100 hover:text-ink-800"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        <div role="group" aria-label="Rango temporal" className="flex flex-nowrap gap-2 overflow-x-auto">
          {OPCIONES_RANGO.map((opt) => {
            const activo = rango === opt.valor;
            return (
              <button
                key={opt.valor}
                type="button"
                onClick={() => setRango(opt.valor)}
                aria-pressed={activo}
                className={cn(
                  'shrink-0 cursor-pointer whitespace-nowrap rounded-pill px-4 py-2 text-sm font-medium transition-colors duration-200',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-500',
                  activo
                    ? 'bg-marca-600 text-white shadow-suave'
                    : 'bg-white text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50',
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {rango === 'personalizado' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Desde" htmlFor="neg-desde">
            <Input id="neg-desde" type="date" value={desdeCustom} onChange={(e) => setDesdeCustom(e.target.value)} />
          </Field>
          <Field label="Hasta" htmlFor="neg-hasta">
            <Input id="neg-hasta" type="date" value={hastaCustom} onChange={(e) => setHastaCustom(e.target.value)} />
          </Field>
        </div>
      ) : null}

      <Tabs valor={pestana} onCambio={setPestana} items={ITEMS} etiqueta="Negocio">
        <TabPanel<Pestana> valor="afiliados">
          {cargando ? (
            <SkeletonTabla />
          ) : (
            <Tabla lista={afiliados} vacio="No hay afiliados en el rango seleccionado." modo="afiliado" onAbrir={setSeleccionado} />
          )}
        </TabPanel>
        <TabPanel<Pestana> valor="leads">
          {cargando ? (
            <SkeletonTabla />
          ) : (
            <Tabla lista={enFunnel} vacio="No hay leads en el rango seleccionado." modo="lead" onAbrir={setSeleccionado} />
          )}
        </TabPanel>
      </Tabs>
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
                      className="inline-flex cursor-pointer items-center rounded-pill bg-marca-50 px-3 py-1 text-xs font-medium text-marca-700 transition-colors hover:bg-marca-100"
                    >
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
