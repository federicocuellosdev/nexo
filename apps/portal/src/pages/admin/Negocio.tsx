import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Calendar, Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { supabase } from '@/lib/supabase';
import {
  obtenerLeadsAdmin,
  obtenerLeadsVendedor,
  esAfiliado,
  calcularCompletitud,
  type LeadResumenAdmin,
} from '@/lib/api';
import { Skeleton } from '@/ui/Skeleton';
import { Chip } from '@/ui/Chip';
import { Input } from '@/ui/Input';
import { Tabs, TabPanel, type ItemTab } from '@/ui/Tabs';
import { FichaLead } from '@/features/admin/FichaLead';
import { FichaFamiliar } from '@/features/admin/FichaFamiliar';

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
export interface AdminNegocioProps {
  fuente?: 'admin' | 'vendedor';
}

export function AdminNegocio({ fuente = 'admin' }: AdminNegocioProps = {}) {
  const navegar = useNavigate();
  const [pestana, setPestana] = useState<Pestana>('afiliados');
  const [leads, setLeads] = useState<LeadResumenAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [seleccionado, setSeleccionado] = useState<LeadResumenAdmin | null>(null);
  // Si estamos viendo un familiar del titular seleccionado (link desde la
  // card de Familiares en la ficha del lead), guardamos su UUID acá.
  const [familiarSeleccionado, setFamiliarSeleccionado] = useState<string | null>(null);

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
      const lista = fuente === 'vendedor'
        ? await obtenerLeadsVendedor(token)
        : await obtenerLeadsAdmin(token);
      setLeads(lista);
    } catch (err) {
      console.error('[AdminNegocio] fetch error', err);
      setError('No pudimos cargar los datos.');
    } finally {
      setCargando(false);
    }
  }, [fuente]);

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
  // Prioridad: si hay un familiar seleccionado (abierto desde la lista de
  // familiares del titular), mostramos su ficha. "Volver" ahí regresa a la
  // ficha del titular.
  if (familiarSeleccionado) {
    return (
      <FichaFamiliar
        beneficiarioId={familiarSeleccionado}
        onVolver={() => setFamiliarSeleccionado(null)}
        onVerTitular={() => setFamiliarSeleccionado(null)}
      />
    );
  }
  if (seleccionado) {
    return (
      <FichaLead
        leadId={seleccionado.id}
        nombre={nombreCompleto(seleccionado)}
        descripcion={seleccionado.email}
        onVolver={() => setSeleccionado(null)}
        fuente={fuente}
        sinAccionesAdmin={fuente === 'vendedor'}
        onVerVendedor={
          fuente === 'admin'
            ? (vendedorId: string) => navegar(`/admin/vendedores?ver=${vendedorId}`)
            : undefined
        }
        onVerFamiliar={(beneficiarioId) => setFamiliarSeleccionado(beneficiarioId)}
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

      {/* Bloque de búsqueda + filtros. Ocupa todo el ancho del contenedor.
          En una sola fila: buscador (flex-1), separador vertical sutil y
          chips de rango temporal. Cuando "Personalizado" está activo,
          abajo aparece un panel compacto con los dos date inputs
          estilizados, integrados al mismo bloque. */}
      <div className="flex w-full flex-col gap-4 border-b border-ink-100 pb-5">
        <div className="flex w-full flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
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

          <div role="group" aria-label="Rango temporal" className="flex flex-wrap gap-2">
            {OPCIONES_RANGO.map((opt) => {
              const activo = rango === opt.valor;
              return (
                <button
                  key={opt.valor}
                  type="button"
                  onClick={() => setRango(opt.valor)}
                  aria-pressed={activo}
                  className={cn(
                    'inline-flex h-11 shrink-0 cursor-pointer items-center whitespace-nowrap rounded-pill px-4 text-sm font-medium transition-colors duration-200',
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
          <div
            data-entrada
            className="flex flex-wrap items-center gap-3 rounded-card bg-marca-50/50 px-4 py-3 ring-1 ring-marca-100"
          >
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-marca-700">
              <Calendar size={14} aria-hidden="true" />
              Rango personalizado
            </span>
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <PickerFecha
                id="neg-desde"
                etiqueta="Desde"
                valor={desdeCustom}
                onChange={setDesdeCustom}
                max={hastaCustom || undefined}
              />
              <span aria-hidden="true" className="text-ink-400">—</span>
              <PickerFecha
                id="neg-hasta"
                etiqueta="Hasta"
                valor={hastaCustom}
                onChange={setHastaCustom}
                min={desdeCustom || undefined}
              />
              {(desdeCustom || hastaCustom) ? (
                <button
                  type="button"
                  onClick={() => {
                    setDesdeCustom('');
                    setHastaCustom('');
                  }}
                  className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-pill px-3 text-xs font-medium text-ink-600 hover:bg-white hover:text-ink-900"
                >
                  <X size={12} />
                  Limpiar
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

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
              {modo === 'lead' ? (
                <th scope="col" className="px-4 py-3">Completitud</th>
              ) : null}
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
                  {modo === 'lead' ? (
                    <td className="whitespace-nowrap px-4 py-3">
                      <BarraCompletitud porcentaje={calcularCompletitud(l)} />
                    </td>
                  ) : null}
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

/**
 * Barra de completitud del perfil. Pinta ok / warn / danger según el
 * porcentaje y agrega el número a la derecha. La métrica se calcula con
 * `calcularCompletitud` desde lib/api — mide solo los datos que el usuario
 * carga (ignora sf_*, mp_*, utm_*, familiares).
 */
function BarraCompletitud({ porcentaje }: { porcentaje: number }) {
  const tono =
    porcentaje >= 80 ? 'bg-ok-500' : porcentaje >= 40 ? 'bg-warn-500' : 'bg-danger-500';
  return (
    <div className="flex min-w-[140px] items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-ink-100">
        <div className={cn('h-full rounded-pill transition-all', tono)} style={{ width: `${porcentaje}%` }} />
      </div>
      <span className="tabular-nums text-xs font-medium text-ink-700">{porcentaje}%</span>
    </div>
  );
}

/**
 * Date picker compacto pill-style. Envuelve un <input type="date"> nativo
 * (para heredar el calendar popover del navegador) con una etiqueta a la
 * izquierda y bordes redondeados — se integra al bloque de filtros.
 */
interface PickerFechaProps {
  id: string;
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
}

function PickerFecha({ id, etiqueta, valor, onChange, min, max }: PickerFechaProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'group inline-flex h-10 cursor-pointer items-center gap-2 rounded-pill bg-white px-3 ring-1 transition-colors',
        valor ? 'ring-marca-300' : 'ring-ink-200 hover:ring-ink-300',
      )}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-ink-500">{etiqueta}</span>
      <input
        id={id}
        type="date"
        value={valor}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer border-0 bg-transparent text-sm text-ink-900 focus:outline-none"
      />
    </label>
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
