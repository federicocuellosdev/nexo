import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Calendar, Check, ChevronDown, Download, Search, X } from 'lucide-react';
import { Dialog } from '@/ui/Dialog';
import { Button } from '@/ui/Button';
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
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoCobertura | 'todos'>('todos');
  const [rango, setRango] = useState<Rango>('mes');
  const [desdeCustom, setDesdeCustom] = useState('');
  const [hastaCustom, setHastaCustom] = useState('');
  const [dialogoRangoAbierto, setDialogoRangoAbierto] = useState(false);

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
      if (estadoFiltro !== 'todos' && estadoDe(l) !== estadoFiltro) continue;
      if (esAfiliado(l)) afi.push(l);
      else fun.push(l);
    }
    return { afiliados: afi, enFunnel: fun };
  }, [leads, busqueda, rango, desdeCustom, hastaCustom, estadoFiltro]);

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
    // Si la fila elegida es un beneficiario, abrimos la FichaFamiliar
    // directa (misma vista que al hacer click desde "Ver ficha" dentro de
    // la seccion Familiares del titular).
    if (seleccionado.es_beneficiario) {
      return (
        <FichaFamiliar
          beneficiarioId={seleccionado.id}
          onVolver={() => setSeleccionado(null)}
          onVerTitular={(titularId) => {
            // Reemplazamos la selección por el titular (mismo tipo de UI).
            const titular = leads.find((l) => l.id === titularId);
            if (titular) setSeleccionado(titular);
            else setSeleccionado(null);
          }}
        />
      );
    }
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

          <FiltroEstado valor={estadoFiltro} onCambio={setEstadoFiltro} />

          <div role="group" aria-label="Rango temporal" className="flex flex-wrap gap-2">
            {OPCIONES_RANGO.map((opt) => {
              const activo = rango === opt.valor;
              return (
                <button
                  key={opt.valor}
                  type="button"
                  onClick={() => {
                    if (opt.valor === 'personalizado') {
                      setDialogoRangoAbierto(true);
                      return;
                    }
                    setRango(opt.valor);
                  }}
                  aria-pressed={activo}
                  className={cn(
                    'inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-pill px-4 text-sm font-medium transition-colors duration-200',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-500',
                    activo
                      ? 'bg-marca-600 text-white shadow-suave'
                      : 'bg-white text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50',
                  )}
                >
                  {opt.valor === 'personalizado' ? <Calendar size={14} aria-hidden="true" /> : null}
                  {opt.valor === 'personalizado' && rango === 'personalizado' && (desdeCustom || hastaCustom)
                    ? `${formatearRangoBreve(desdeCustom, hastaCustom)}`
                    : opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <DialogoRangoPersonalizado
        abierto={dialogoRangoAbierto}
        desdeInicial={desdeCustom}
        hastaInicial={hastaCustom}
        onCerrar={() => setDialogoRangoAbierto(false)}
        onAplicar={(desde, hasta) => {
          setDesdeCustom(desde);
          setHastaCustom(hasta);
          setRango('personalizado');
          setDialogoRangoAbierto(false);
        }}
      />

      <Tabs
        valor={pestana}
        onCambio={setPestana}
        items={ITEMS}
        etiqueta="Negocio"
        trailing={
          <BotonDescargaCSV
            lista={pestana === 'afiliados' ? afiliados : enFunnel}
            nombreArchivo={pestana}
            disabled={cargando || (pestana === 'afiliados' ? afiliados.length : enFunnel.length) === 0}
          />
        }
      >
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
              {modo === 'afiliado' ? <th scope="col" className="px-4 py-3">Alta</th> : null}
              {modo === 'afiliado' ? <th scope="col" className="px-4 py-3">Estado</th> : null}
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
                  {modo === 'afiliado' ? (
                    <td className="whitespace-nowrap px-4 py-3 text-ink-700">{formatearFecha(l.created_at)}</td>
                  ) : null}
                  {modo === 'afiliado' ? (
                    <td className="whitespace-nowrap px-4 py-3">
                      <ChipEstado lead={l} modo={modo} />
                    </td>
                  ) : null}
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

type EstadoCobertura = 'activo' | 'pausado' | 'sin-cobertura';

function estadoDe(l: LeadResumenAdmin): EstadoCobertura {
  if (esAfiliado(l)) return l.cobertura_pausada ? 'pausado' : 'activo';
  return 'sin-cobertura';
}

const OPCIONES_ESTADO: Array<{ valor: EstadoCobertura | 'todos'; label: string }> = [
  { valor: 'todos', label: 'Todos los estados' },
  { valor: 'activo', label: 'Activo' },
  { valor: 'pausado', label: 'Pausado' },
  { valor: 'sin-cobertura', label: 'Sin cobertura' },
];

/** Chip de estado para la tabla. Verde = activo, amarillo = pausado,
 *  gris = sin cobertura. Usa los tokens que sí existen en el design
 *  system (ok/warn tienen solo 50/500/700; ink va de 50 a 950). */
function ChipEstado({ lead, modo }: { lead: LeadResumenAdmin; modo: 'afiliado' | 'lead' }) {
  const estado = estadoDe(lead);
  if (estado === 'activo') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-pill bg-ok-50 px-2.5 py-1 text-xs font-medium text-ok-700 ring-1 ring-ok-500/40">
        <span aria-hidden="true" className="inline-block size-1.5 rounded-pill bg-ok-500" />
        Activo
      </span>
    );
  }
  if (estado === 'pausado') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-pill bg-warn-50 px-2.5 py-1 text-xs font-medium text-warn-700 ring-1 ring-warn-500/40">
        <span aria-hidden="true" className="inline-block size-1.5 rounded-pill bg-warn-500" />
        Pausado
      </span>
    );
  }
  // sin-cobertura — para leads diferenciamos "pagó / falta perfil" vs "sin pagar"
  if (modo === 'lead' && lead.mp_status === 'authorized') {
    return <Chip tono="warn">Pagó · falta perfil</Chip>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600 ring-1 ring-ink-300">
      <span aria-hidden="true" className="inline-block size-1.5 rounded-pill bg-ink-400" />
      Sin cobertura
    </span>
  );
}

/**
 * Barra de completitud del perfil. Pinta ok / warn / danger según el
 * porcentaje y agrega el número a la derecha. La métrica se calcula con
 * `calcularCompletitud` desde lib/api — mide solo los datos que el usuario
 * carga (ignora sf_*, mp_*, utm_*, familiares).
 */
function BarraCompletitud({ porcentaje }: { porcentaje: number }) {
  const color =
    porcentaje >= 80 ? 'text-ok-700' : porcentaje >= 40 ? 'text-warn-700' : 'text-danger-700';
  return (
    <span className={cn('tabular-nums text-sm font-semibold', color)}>{porcentaje}%</span>
  );
}


// ───────────────────── Filtro de estado (dropdown custom) ─────────────────────

const TONOS_DOT: Record<EstadoCobertura | 'todos', string> = {
  todos: 'bg-ink-300',
  activo: 'bg-ok-500',
  pausado: 'bg-warn-500',
  'sin-cobertura': 'bg-ink-400',
};

function FiltroEstado({
  valor,
  onCambio,
}: {
  valor: EstadoCobertura | 'todos';
  onCambio: (v: EstadoCobertura | 'todos') => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const labelActual = OPCIONES_ESTADO.find((o) => o.valor === valor)?.label ?? 'Estado';

  useEffect(() => {
    if (!abierto) return;
    function cerrar(ev: MouseEvent) {
      if (contenedor.current && !contenedor.current.contains(ev.target as Node)) setAbierto(false);
    }
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [abierto]);

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        className={cn(
          'inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-pill bg-white px-4 text-sm font-medium text-ink-800 ring-1 ring-ink-200 transition-colors hover:bg-ink-50',
          abierto ? 'ring-marca-400' : '',
        )}
      >
        <span aria-hidden="true" className={cn('inline-block size-2 rounded-pill', TONOS_DOT[valor])} />
        {labelActual}
        <ChevronDown size={14} className={cn('text-ink-500 transition-transform', abierto ? 'rotate-180' : '')} />
      </button>
      {abierto ? (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-20 mt-2 min-w-[200px] overflow-hidden rounded-card bg-white py-1 shadow-flotante ring-1 ring-ink-200"
        >
          {OPCIONES_ESTADO.map((opt) => {
            const seleccionado = valor === opt.valor;
            return (
              <li key={opt.valor}>
                <button
                  type="button"
                  role="option"
                  aria-selected={seleccionado}
                  onClick={() => {
                    onCambio(opt.valor);
                    setAbierto(false);
                  }}
                  className={cn(
                    'flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors',
                    seleccionado ? 'bg-marca-50 text-marca-800' : 'text-ink-800 hover:bg-ink-50',
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden="true" className={cn('inline-block size-2 rounded-pill', TONOS_DOT[opt.valor])} />
                    {opt.label}
                  </span>
                  {seleccionado ? <Check size={14} className="text-marca-700" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

// ──────────── Rango personalizado (dialog con 2 date pickers) ────────────

function formatearRangoBreve(desde: string, hasta: string): string {
  const fmt = (iso: string) => {
    if (!iso) return '…';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y?.slice(2)}`;
  };
  if (desde && hasta) return `${fmt(desde)} — ${fmt(hasta)}`;
  if (desde) return `Desde ${fmt(desde)}`;
  if (hasta) return `Hasta ${fmt(hasta)}`;
  return 'Personalizado';
}

function DialogoRangoPersonalizado({
  abierto,
  desdeInicial,
  hastaInicial,
  onCerrar,
  onAplicar,
}: {
  abierto: boolean;
  desdeInicial: string;
  hastaInicial: string;
  onCerrar: () => void;
  onAplicar: (desde: string, hasta: string) => void;
}) {
  const [desde, setDesde] = useState(desdeInicial);
  const [hasta, setHasta] = useState(hastaInicial);

  useEffect(() => {
    if (abierto) {
      setDesde(desdeInicial);
      setHasta(hastaInicial);
    }
  }, [abierto, desdeInicial, hastaInicial]);

  const invalido = desde && hasta && new Date(desde) > new Date(hasta);

  return (
    <Dialog
      abierto={abierto}
      onCambio={(ab) => {
        if (!ab) onCerrar();
      }}
      titulo="Rango personalizado"
      descripcion="Elegí la fecha de inicio y la fecha de fin. Filtra por fecha de creación del alta."
    >
      <div className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-marca-700">Desde</span>
            <input
              type="date"
              value={desde}
              max={hasta || undefined}
              onChange={(e) => setDesde(e.target.value)}
              className="h-11 rounded-campo border border-ink-200 bg-white px-3 text-base text-ink-900 focus:outline-none focus:ring-2 focus:ring-marca-400"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-marca-700">Hasta</span>
            <input
              type="date"
              value={hasta}
              min={desde || undefined}
              onChange={(e) => setHasta(e.target.value)}
              className="h-11 rounded-campo border border-ink-200 bg-white px-3 text-base text-ink-900 focus:outline-none focus:ring-2 focus:ring-marca-400"
            />
          </label>
        </div>

        {invalido ? (
          <p className="text-sm text-danger-700">La fecha "Desde" no puede ser posterior a "Hasta".</p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <Button
            type="button"
            ancho="full"
            tamano="lg"
            className="sm:w-auto"
            disabled={Boolean(invalido)}
            onClick={() => onAplicar(desde, hasta)}
          >
            Aplicar rango
          </Button>
          <Button
            type="button"
            variante="secundario"
            ancho="full"
            tamano="lg"
            className="sm:w-auto"
            onClick={() => {
              setDesde('');
              setHasta('');
              onAplicar('', '');
            }}
          >
            Limpiar
          </Button>
          <Button type="button" variante="fantasma" ancho="full" tamano="lg" className="sm:w-auto" onClick={onCerrar}>
            Cancelar
          </Button>
        </div>
      </div>
    </Dialog>
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

// ──────────────────── Descarga CSV ────────────────────

/** Escapa un valor para CSV estándar RFC 4180: si contiene comas, saltos de
 *  línea o comillas, se envuelve en comillas dobles y las comillas internas
 *  se duplican. */
function escaparCSV(valor: unknown): string {
  if (valor === null || valor === undefined) return '';
  const s = typeof valor === 'string' ? valor : String(valor);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Devuelve `obj[clave]` tipado como unknown para no romper con `perfil`
 *  siendo `Record<string, unknown> | null`. Soporta paths con punto. */
function extraer(obj: Record<string, unknown> | null | undefined, path: string): unknown {
  if (!obj) return '';
  const partes = path.split('.');
  let cur: unknown = obj;
  for (const p of partes) {
    if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return '';
    }
  }
  return cur ?? '';
}

/** Definición de columnas del CSV. El orden acá es el orden que ve el
 *  usuario en Excel. Mantener en sync con `LeadResumenAdmin` (lib/api) si
 *  se agregan campos nuevos. */
const COLUMNAS_CSV: Array<{ header: string; accesor: (l: LeadResumenAdmin) => unknown }> = [
  { header: 'ID', accesor: (l) => l.id },
  { header: 'Tipo', accesor: (l) => (l.es_beneficiario ? 'Familiar' : 'Titular') },
  { header: 'Titular ID', accesor: (l) => l.titular_lead_id ?? '' },
  { header: 'Nombre', accesor: (l) => l.nombre ?? '' },
  { header: 'Apellido', accesor: (l) => l.apellido ?? '' },
  { header: 'Email', accesor: (l) => l.email },
  { header: 'DNI', accesor: (l) => l.dni ?? '' },
  { header: 'Teléfono', accesor: (l) => l.telefono ?? '' },
  { header: 'Fecha de nacimiento', accesor: (l) => l.fecha_nacimiento ?? '' },
  { header: 'Plan', accesor: (l) => l.item_nombre ?? '' },
  { header: 'Estado MP', accesor: (l) => l.mp_status ?? '' },
  { header: 'Cobertura pausada', accesor: (l) => (l.cobertura_pausada ? 'Sí' : 'No') },
  { header: 'Completitud (%)', accesor: (l) => calcularCompletitud(l) },
  { header: 'Alta', accesor: (l) => l.created_at },
  // Perfil (JSON persistido en v3.leads.perfil, cargado por el wizard del portal).
  { header: 'Tipo documento (perfil)', accesor: (l) => extraer(l.perfil, 'tipoDocumento') },
  { header: 'Nro documento (perfil)', accesor: (l) => extraer(l.perfil, 'numeroDocumento') },
  { header: 'Sexo', accesor: (l) => extraer(l.perfil, 'sexo') },
  { header: 'Fecha nacimiento (perfil)', accesor: (l) => extraer(l.perfil, 'fechaNacimiento') },
  { header: 'Calle', accesor: (l) => extraer(l.perfil, 'domicilio.calle') },
  { header: 'Número', accesor: (l) => extraer(l.perfil, 'domicilio.numero') },
  { header: 'Piso', accesor: (l) => extraer(l.perfil, 'domicilio.piso') },
  { header: 'Departamento', accesor: (l) => extraer(l.perfil, 'domicilio.departamento') },
  { header: 'Torre', accesor: (l) => extraer(l.perfil, 'domicilio.torre') },
  { header: 'Localidad', accesor: (l) => extraer(l.perfil, 'domicilio.localidad') },
  { header: 'Provincia', accesor: (l) => extraer(l.perfil, 'domicilio.provincia') },
  { header: 'Código postal', accesor: (l) => extraer(l.perfil, 'domicilio.cp') },
  { header: 'País', accesor: (l) => extraer(l.perfil, 'domicilio.pais') },
  // Fallback: JSON crudo del perfil por si en el futuro aparecen campos que
  // no están mapeados arriba. Garantiza que "todos los datos" realmente salen.
  { header: 'Perfil (JSON)', accesor: (l) => (l.perfil ? JSON.stringify(l.perfil) : '') },
];

function construirCSV(lista: LeadResumenAdmin[]): string {
  const headers = COLUMNAS_CSV.map((c) => escaparCSV(c.header)).join(',');
  const filas = lista.map((l) => COLUMNAS_CSV.map((c) => escaparCSV(c.accesor(l))).join(','));
  // \r\n por RFC 4180 — Excel en Windows espera CRLF para no mezclar filas.
  return [headers, ...filas].join('\r\n');
}

function descargarCSV(nombreArchivo: string, contenido: string) {
  // BOM UTF-8 para que Excel detecte el encoding y no rompa tildes/ñ.
  const blob = new Blob(['﻿' + contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function BotonDescargaCSV({
  lista,
  nombreArchivo,
  disabled,
}: {
  lista: LeadResumenAdmin[];
  nombreArchivo: string;
  disabled?: boolean;
}) {
  function onClick() {
    const csv = construirCSV(lista);
    const fecha = new Date().toISOString().slice(0, 10);
    descargarCSV(`negocio-${nombreArchivo}-${fecha}.csv`, csv);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Descargar ${nombreArchivo} como CSV`}
      title={disabled ? 'Nada para descargar' : `Descargar ${lista.length} filas como CSV`}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-pill bg-white px-3 text-xs font-medium text-ink-700 ring-1 ring-ink-200 transition-colors',
        'hover:bg-ink-50 hover:text-ink-900',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-500',
        disabled ? 'cursor-not-allowed opacity-50 hover:bg-white hover:text-ink-700' : 'cursor-pointer',
      )}
    >
      <Download size={12} aria-hidden="true" />
      {nombreArchivo === 'leads' ? 'CSV LEADS' : 'CSV AFILIADO'}
    </button>
  );
}
