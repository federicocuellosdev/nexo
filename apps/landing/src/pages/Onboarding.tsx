import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { Copy, Check, CreditCard, QrCode, Trash2, Plus, ShieldCheck } from 'lucide-react';

/** Filtra todo lo que no sea dígito. Lo usamos en onChange de campos
 *  estrictamente numéricos (DNI, teléfono, altura, CP) para evitar que el
 *  usuario tipee letras, espacios o puntos. Preferimos esto sobre `type="number"`
 *  para no mostrar los spinners nativos del browser. */
const soloDigitos = (s: string): string => s.replace(/\D/g, '');
import { Card } from '@/ui/Card';
import { Field } from '@/ui/Field';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { Select } from '@/ui/Select';
import { BirthDatePicker } from '@/ui/BirthDatePicker';
import { Money } from '@/ui/Money';
import { QR } from '@/ui/QR';
import { cn } from '@/lib/cn';
import { PLANES } from '@/mock/planes';
import {
  crearLead,
  crearSuscripcionOnboarding,
  guardarPerfilOnboarding,
  ApiError,
  type BeneficiarioOnboarding,
} from '@/lib/api';
import { capturarTrazabilidad } from '@/lib/trazabilidad';

/**
 * Onboarding público usado por vendedores en calle. 5 pasos que siguen el
 * mismo partido que la app en producción (contacto → documento → domicilio
 * → familiares → resumen+pago).
 *
 * Params:
 *  - ?qr=true          muestra QR del init_point MP en el resumen
 *  - ?ref={vendedorId} atribuye la venta al vendedor (backend todavía no lo
 *                      persiste — iteración pendiente)
 */

const PLAN = PLANES[0];
const MAX_FAMILIARES = 5;

const OPCIONES_SEXO = [
  { value: 'F', label: 'Femenino' },
  { value: 'M', label: 'Masculino' },
  { value: 'X', label: 'X' },
];

const OPCIONES_RELACION = [
  { value: 'conyuge', label: 'Cónyuge' },
  { value: 'hijo', label: 'Hijo/a' },
  { value: 'padre', label: 'Padre' },
  { value: 'madre', label: 'Madre' },
  { value: 'otro', label: 'Otro' },
];

// Cobertura hoy solo en Rosario y alrededores — misma lista que usa el
// portal en PerfilWizard.
const OPCIONES_LOCALIDAD = [
  { value: 'Rosario', label: 'Rosario' },
  { value: 'Granadero Baigorria', label: 'Granadero Baigorria' },
  { value: 'Villa Gobernador Gálvez', label: 'Villa Gobernador Gálvez' },
];

type Paso = 1 | 2 | 3 | 4 | 5 | 6;

interface DatosContacto {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
}

interface DatosDocumento {
  dni: string;
  fechaNacimiento: string;
  sexo: '' | 'F' | 'M' | 'X';
}

interface DatosDomicilio {
  calle: string;
  numero: string;
  piso: string;
  departamento: string;
  torre: string;
  localidad: string;
  provincia: string;
  cp: string;
}

type BeneficiarioForm = Omit<BeneficiarioOnboarding, 'tipoDocumento'>;

const CONTACTO_VACIO: DatosContacto = { nombre: '', apellido: '', email: '', telefono: '' };
const DOCUMENTO_VACIO: DatosDocumento = { dni: '', fechaNacimiento: '', sexo: '' };
const DOMICILIO_VACIO: DatosDomicilio = {
  calle: '',
  numero: '',
  piso: '',
  departamento: '',
  torre: '',
  localidad: '',
  provincia: 'Santa Fe',
  cp: '',
};
const BENEFICIARIO_VACIO: BeneficiarioForm = {
  nombre: '',
  apellido: '',
  numeroDocumento: '',
  sexo: 'F',
  fechaNacimiento: '',
  relacion: 'hijo',
};

interface ResultadoOnboarding {
  leadId: string;
  initPoint: string;
  preapprovalId: string;
}

export function Onboarding() {
  const [parametros] = useSearchParams();
  const modoQR = parametros.get('qr') === 'true';
  // Vendedor atribuido. Acepta UUID (36 chars con guiones) o codigo_corto
  // (6 chars A-Z0-9) — el backend resuelve ambos al UUID del vendedor
  // antes del insert. Cortamos acá los formatos obvios inválidos para no
  // mandar un 400 por un ref mal copiado del link compartido.
  const refParam = parametros.get('ref');
  let vendedorId: string | undefined;
  if (refParam) {
    if (/^[0-9a-f-]{36}$/i.test(refParam)) {
      vendedorId = refParam;
    } else if (/^[A-Z0-9]{6}$/i.test(refParam)) {
      // Normalizo a mayúsculas: el backend compara con `.eq('codigo_corto')`
      // sobre la columna persistida en uppercase.
      vendedorId = refParam.toUpperCase();
    }
  }

  const [paso, setPaso] = useState<Paso>(1);
  const [contacto, setContacto] = useState<DatosContacto>(CONTACTO_VACIO);
  const [documento, setDocumento] = useState<DatosDocumento>(DOCUMENTO_VACIO);
  const [domicilio, setDomicilio] = useState<DatosDomicilio>(DOMICILIO_VACIO);
  const [beneficiarios, setBeneficiarios] = useState<BeneficiarioForm[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoOnboarding | null>(null);

  const total = PLAN.precio * (1 + beneficiarios.length);

  // El boton Continuar queda disabled hasta que el paso valide. Usamos el
  // mismo validar() de abajo para que la regla sea unica — si cambia
  // una validacion, el boton se habilita/deshabilita automaticamente.
  const pasoValido = validar(paso) === null;

  function validar(p: Paso): string | null {
    // Paso 1: Plan — informativo (solo hay un plan), nada que validar.
    if (p === 1) return null;
    if (p === 2) {
      const c = contacto;
      if (!c.nombre.trim()) return 'Ingresá el nombre';
      if (!c.apellido.trim()) return 'Ingresá el apellido';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email.trim())) return 'Revisá el email';
      if (!/^\d{8,15}$/.test(c.telefono.trim())) return 'Teléfono debe ser 8-15 dígitos';
      return null;
    }
    if (p === 3) {
      const d = documento;
      if (!/^\d{7,8}$/.test(d.dni.trim())) return 'DNI debe ser 7-8 dígitos';
      if (!d.fechaNacimiento) return 'Ingresá la fecha de nacimiento';
      if (d.sexo === '') return 'Seleccioná el sexo';
      return null;
    }
    if (p === 4) {
      const d = domicilio;
      if (!d.calle.trim()) return 'Ingresá la calle';
      if (!d.numero.trim()) return 'Ingresá el número';
      if (!d.localidad.trim()) return 'Ingresá la localidad';
      if (!d.provincia.trim()) return 'Ingresá la provincia';
      if (!d.cp.trim()) return 'Ingresá el código postal';
      return null;
    }
    if (p === 5) {
      for (let i = 0; i < beneficiarios.length; i += 1) {
        const b = beneficiarios[i]!;
        const n = i + 1;
        if (!b.nombre.trim()) return `Familiar ${n}: falta el nombre`;
        if (!b.apellido.trim()) return `Familiar ${n}: falta el apellido`;
        if (!/^\d{7,8}$/.test(b.numeroDocumento.trim())) return `Familiar ${n}: DNI debe ser 7-8 dígitos`;
        if (!b.fechaNacimiento) return `Familiar ${n}: falta la fecha de nacimiento`;
      }
      return null;
    }
    return null;
  }

  async function avanzar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando) return;

    const err = validar(paso);
    if (err) {
      setError(err);
      return;
    }
    setError(null);

    if (paso < 5) {
      setPaso((paso + 1) as Paso);
      return;
    }

    // Paso 5 (Familiares) → envío al backend (crea lead + perfil + MP sub)
    setEnviando(true);
    try {
      const resLead = await crearLead({
        tipo: 'plan',
        itemId: PLAN.slug,
        itemNombre: PLAN.nombre,
        nombre: contacto.nombre.trim(),
        apellido: contacto.apellido.trim(),
        email: contacto.email.trim(),
        telefono: contacto.telefono.trim(),
        dni: documento.dni.trim(),
        // Onboarding de vendedores: NO mandar a SF mientras la integración
        // está en pruebas (ver skipSf en back /leads).
        skipSf: true,
        // Trazabilidad: marcamos canal + vendedor atribuido (si vino en ?ref=).
        canal: 'onboarding',
        ...(vendedorId ? { vendedorId } : {}),
        ...capturarTrazabilidad(),
      });

      await guardarPerfilOnboarding(resLead.leadId, {
        perfil: {
          tipoDocumento: 'DNI',
          numeroDocumento: documento.dni.trim(),
          sexo: documento.sexo as 'F' | 'M' | 'X',
          fechaNacimiento: documento.fechaNacimiento,
          domicilio: {
            calle: domicilio.calle.trim(),
            numero: domicilio.numero.trim(),
            piso: domicilio.piso.trim() || undefined,
            departamento: domicilio.departamento.trim() || undefined,
            torre: domicilio.torre.trim() || undefined,
            localidad: domicilio.localidad.trim(),
            provincia: domicilio.provincia.trim(),
            cp: domicilio.cp.trim(),
            pais: 'Argentina',
          },
        },
        beneficiarios: beneficiarios.map((b) => ({
          nombre: b.nombre.trim(),
          apellido: b.apellido.trim(),
          tipoDocumento: 'DNI',
          numeroDocumento: b.numeroDocumento.trim(),
          sexo: b.sexo,
          fechaNacimiento: b.fechaNacimiento,
          relacion: b.relacion,
        })),
        familiaresCount: beneficiarios.length,
      });

      // El monto escala con familiares — cada uno paga su cuota del plan.
      const resMp = await crearSuscripcionOnboarding({
        planId: PLAN.slug,
        planNombre: PLAN.nombre,
        monto: total,
        emailMp: contacto.email.trim(),
        leadId: resLead.leadId,
      });

      setResultado({
        leadId: resLead.leadId,
        initPoint: resMp.initPoint,
        preapprovalId: resMp.preapprovalId,
      });
      setPaso(6);
    } catch (err) {
      console.error('[onboarding] error', err);
      if (err instanceof ApiError && err.cuerpo.error === 'mp_no_configurado') {
        setError('MercadoPago no está configurado. Avisá a soporte.');
      } else {
        setError('No pudimos completar el alta. Revisá los datos e intentá de nuevo.');
      }
    } finally {
      setEnviando(false);
    }
  }

  function volver() {
    setError(null);
    setPaso((paso - 1) as Paso);
  }

  function agregarBeneficiario() {
    if (beneficiarios.length >= MAX_FAMILIARES) return;
    setBeneficiarios((prev) => [...prev, { ...BENEFICIARIO_VACIO }]);
  }

  function quitarBeneficiario(idx: number) {
    setBeneficiarios((prev) => prev.filter((_, i) => i !== idx));
  }

  function actualizarBeneficiario(idx: number, campo: keyof BeneficiarioForm, valor: string) {
    setBeneficiarios((prev) => prev.map((b, i) => (i === idx ? { ...b, [campo]: valor } : b)));
  }

  return (
    <div className="mx-auto max-w-[640px] px-4 pt-6 pb-16 lg:pt-10">
      <h1 className="text-2xl text-ink-950">Onboarding</h1>
      <p className="mt-2 text-sm text-ink-600">
        Cargá los datos del cliente. Al terminar te mostramos el {modoQR ? 'QR' : 'link'} para pagar.
      </p>

      <Card className="mt-6 flex flex-col gap-5">
        <Indicador paso={paso} />

        {paso === 1 ? (
          <FormPlan onSubmit={avanzar} enviando={enviando} />
        ) : paso === 2 ? (
          <FormContacto datos={contacto} onCambio={setContacto} onAtras={volver} onSubmit={avanzar} error={error} enviando={enviando} pasoValido={pasoValido} />
        ) : paso === 3 ? (
          <FormDocumento datos={documento} onCambio={setDocumento} onAtras={volver} onSubmit={avanzar} error={error} enviando={enviando} pasoValido={pasoValido} />
        ) : paso === 4 ? (
          <FormDomicilio datos={domicilio} onCambio={setDomicilio} onAtras={volver} onSubmit={avanzar} error={error} enviando={enviando} pasoValido={pasoValido} />
        ) : paso === 5 ? (
          <FormFamiliares
            beneficiarios={beneficiarios}
            onAgregar={agregarBeneficiario}
            onQuitar={quitarBeneficiario}
            onActualizar={actualizarBeneficiario}
            onAtras={volver}
            onSubmit={avanzar}
            error={error}
            enviando={enviando}
            pasoValido={pasoValido}
            total={total}
            familiaresCount={beneficiarios.length}
          />
        ) : resultado ? (
          <Resumen contacto={contacto} total={total} familiaresCount={beneficiarios.length} resultado={resultado} modoQR={modoQR} />
        ) : null}
      </Card>
    </div>
  );
}

function Indicador({ paso }: { paso: Paso }) {
  const titulo =
    paso === 1 ? 'Plan'
    : paso === 2 ? 'Datos del titular'
    : paso === 3 ? 'Documento'
    : paso === 4 ? 'Domicilio'
    : paso === 5 ? 'Familiares'
    : 'Listo';
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-ink-500">{`Paso ${paso} de 6`}</span>
        <span className="text-sm text-ink-600">{titulo}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={paso}
        aria-valuemin={1}
        aria-valuemax={6}
        aria-label="Progreso del onboarding"
        className="mt-3 flex items-center gap-2"
      >
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <span
            key={n}
            aria-hidden="true"
            className={cn('size-2 rounded-pill transition-colors duration-200', n <= paso ? 'bg-marca-600' : 'bg-ink-200')}
          />
        ))}
      </div>
    </div>
  );
}

interface PasoProps<T> {
  datos: T;
  onCambio: (d: T) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onAtras?: () => void;
  error: string | null;
  enviando: boolean;
  /** Si el paso tiene sus requeridos completos. El boton Continuar queda
   *  disabled mientras sea false. */
  pasoValido: boolean;
}

function FormContacto({ datos, onCambio, onAtras, onSubmit, error, enviando, pasoValido }: PasoProps<DatosContacto>) {
  useEffect(() => {
    document.getElementById('onb-nombre')?.focus();
  }, []);
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {/* Nombre + Apellido en una fila (son datos emparejados y cortos);
          email y telefono full-width porque son mas anchos y se leen mejor
          ocupando todo el input. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" htmlFor="onb-nombre" requerido>
          <Input id="onb-nombre" placeholder="Juan" value={datos.nombre} onChange={(e) => onCambio({ ...datos, nombre: e.target.value })} />
        </Field>
        <Field label="Apellido" htmlFor="onb-apellido" requerido>
          <Input id="onb-apellido" placeholder="García" value={datos.apellido} onChange={(e) => onCambio({ ...datos, apellido: e.target.value })} />
        </Field>
      </div>
      <Field label="Email" htmlFor="onb-email" requerido>
        <Input id="onb-email" type="email" inputMode="email" placeholder="tu@email.com" value={datos.email} onChange={(e) => onCambio({ ...datos, email: e.target.value })} />
      </Field>
      <Field label="Teléfono" htmlFor="onb-telefono" requerido>
        <Input id="onb-telefono" inputMode="numeric" maxLength={15} placeholder="3411234567" value={datos.telefono} onChange={(e) => onCambio({ ...datos, telefono: soloDigitos(e.target.value) })} />
      </Field>
      {error ? <p className="text-sm text-danger-700">{error}</p> : null}
      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <Button type="submit" ancho="full" tamano="lg" className="sm:w-auto" disabled={enviando || !pasoValido}>
          Continuar
        </Button>
        <Button type="button" variante="secundario" ancho="full" tamano="lg" className="sm:w-auto" onClick={onAtras} disabled={enviando}>
          Atrás
        </Button>
      </div>
    </form>
  );
}

/**
 * Paso 1 "Plan". Hoy solo hay un plan — toda la card es el CTA: click en
 * cualquier parte submite el form y avanza al paso 2. Sin botón Continuar
 * aparte porque la card ya ES el botón.
 */
function FormPlan({ onSubmit, enviando }: { onSubmit: (e: FormEvent<HTMLFormElement>) => void; enviando: boolean }) {
  return (
    <form onSubmit={onSubmit} noValidate>
      <button
        type="submit"
        disabled={enviando}
        aria-label={`Continuar con el plan ${PLAN.nombre}, ${PLAN.precio} pesos por mes`}
        className={cn(
          'group flex w-full cursor-pointer flex-col gap-4 rounded-card bg-marca-50/60 p-6 text-left ring-1 ring-marca-200 transition-colors',
          'hover:bg-marca-50 hover:ring-marca-300',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-500',
          'disabled:cursor-not-allowed disabled:opacity-60',
        )}
      >
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-pill bg-marca-100 text-marca-700"
          >
            <ShieldCheck size={22} strokeWidth={1.75} />
          </span>
          <p className="font-display text-xl leading-tight text-ink-950">{PLAN.nombre}</p>
        </div>
        <div className="border-t border-marca-200/70" aria-hidden="true" />
        <Money monto={PLAN.precio} periodo="por mes" tamano="md" />
      </button>
    </form>
  );
}

function FormDocumento({ datos, onCambio, onAtras, onSubmit, error, enviando, pasoValido }: PasoProps<DatosDocumento>) {
  useEffect(() => {
    document.getElementById('onb-dni')?.focus();
  }, []);
  // Mismo partido que PerfilWizard del portal: DNI y Sexo en fila (anchos
  // cortos van juntos); fecha de nacimiento abajo con el BirthDatePicker
  // (3 combos Día/Mes/Año) en vez de <input type="date">, que obliga a
  // navegar año a año desde el actual.
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="DNI" htmlFor="onb-dni" ayuda="Sin puntos ni espacios" requerido>
          <Input id="onb-dni" inputMode="numeric" maxLength={8} placeholder="40123456" value={datos.dni} onChange={(e) => onCambio({ ...datos, dni: soloDigitos(e.target.value) })} />
        </Field>
        <Field label="Sexo" htmlFor="onb-sexo" requerido>
          <Select
            id="onb-sexo"
            opciones={OPCIONES_SEXO}
            placeholder="Elegí una opción"
            value={datos.sexo}
            onChange={(v) => onCambio({ ...datos, sexo: v as DatosDocumento['sexo'] })}
          />
        </Field>
      </div>
      <Field label="Fecha de nacimiento" htmlFor="onb-fechanac" ayuda="Necesitamos verificar que sea mayor de edad" requerido>
        <BirthDatePicker
          id="onb-fechanac"
          value={datos.fechaNacimiento}
          onChange={(iso) => onCambio({ ...datos, fechaNacimiento: iso })}
        />
      </Field>
      {error ? <p className="text-sm text-danger-700">{error}</p> : null}
      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <Button type="submit" ancho="full" tamano="lg" className="sm:w-auto" disabled={enviando || !pasoValido}>
          Continuar
        </Button>
        <Button type="button" variante="secundario" ancho="full" tamano="lg" className="sm:w-auto" onClick={onAtras} disabled={enviando}>
          Atrás
        </Button>
      </div>
    </form>
  );
}

function FormDomicilio({ datos, onCambio, onAtras, onSubmit, error, enviando, pasoValido }: PasoProps<DatosDomicilio>) {
  useEffect(() => {
    document.getElementById('onb-calle')?.focus();
  }, []);
  // Layout 1:1 con PerfilWizard del portal:
  //  - Calle (2fr) + Número (1fr)
  //  - Piso + Depto + Torre en 3 columnas
  //  - Localidad (Select) + CP en 2 columnas
  //  - Provincia/País no se piden (Nexo factura solo en Santa Fe / AR).
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <Field label="Calle" htmlFor="onb-calle" requerido>
          <Input
            id="onb-calle"
            autoComplete="address-line1"
            placeholder="Pellegrini"
            value={datos.calle}
            onChange={(e) => onCambio({ ...datos, calle: e.target.value })}
          />
        </Field>
        <Field label="Número" htmlFor="onb-numero" requerido>
          <Input id="onb-numero" inputMode="numeric" maxLength={6} placeholder="1234" value={datos.numero} onChange={(e) => onCambio({ ...datos, numero: soloDigitos(e.target.value) })} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Piso" htmlFor="onb-piso">
          <Input
            id="onb-piso"
            autoComplete="address-line2"
            placeholder="3"
            value={datos.piso}
            onChange={(e) => onCambio({ ...datos, piso: e.target.value })}
          />
        </Field>
        <Field label="Departamento" htmlFor="onb-depto">
          <Input
            id="onb-depto"
            autoComplete="address-line3"
            placeholder="B"
            value={datos.departamento}
            onChange={(e) => onCambio({ ...datos, departamento: e.target.value })}
          />
        </Field>
        <Field label="Torre" htmlFor="onb-torre">
          <Input
            id="onb-torre"
            placeholder="Norte"
            value={datos.torre}
            onChange={(e) => onCambio({ ...datos, torre: e.target.value })}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Localidad" htmlFor="onb-loc" requerido>
          <Select
            id="onb-loc"
            opciones={OPCIONES_LOCALIDAD}
            placeholder="Elegí tu localidad"
            value={datos.localidad}
            onChange={(v) => onCambio({ ...datos, localidad: v })}
          />
        </Field>
        <Field label="Código postal" htmlFor="onb-cp" requerido>
          <Input id="onb-cp" inputMode="numeric" maxLength={5} autoComplete="postal-code" placeholder="2000" value={datos.cp} onChange={(e) => onCambio({ ...datos, cp: soloDigitos(e.target.value) })} />
        </Field>
      </div>

      {error ? <p className="text-sm text-danger-700">{error}</p> : null}
      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <Button type="submit" ancho="full" tamano="lg" className="sm:w-auto" disabled={enviando || !pasoValido}>
          Continuar
        </Button>
        <Button type="button" variante="secundario" ancho="full" tamano="lg" className="sm:w-auto" onClick={onAtras} disabled={enviando}>
          Atrás
        </Button>
      </div>
    </form>
  );
}

interface FormFamiliaresProps {
  beneficiarios: BeneficiarioForm[];
  onAgregar: () => void;
  onQuitar: (idx: number) => void;
  onActualizar: (idx: number, campo: keyof BeneficiarioForm, valor: string) => void;
  onAtras: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  error: string | null;
  enviando: boolean;
  pasoValido: boolean;
  total: number;
  familiaresCount: number;
}

function FormFamiliares({
  beneficiarios,
  onAgregar,
  onQuitar,
  onActualizar,
  onAtras,
  onSubmit,
  error,
  enviando,
  pasoValido,
  total,
  familiaresCount,
}: FormFamiliaresProps) {
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-ink-700">
          Sumá familiares al plan. Cada uno paga su cuota ({PLAN.nombre} · ${PLAN.precio.toLocaleString('es-AR')}/mes).
        </p>
        <p className="mt-1 text-xs text-ink-500">Opcional — podés continuar sin agregar ninguno.</p>
      </div>

      {beneficiarios.map((b, idx) => (
        <div key={idx} className="rounded-card bg-ink-50 p-4 ring-1 ring-ink-200">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-ink-800">Familiar {idx + 1}</p>
            <button
              type="button"
              onClick={() => onQuitar(idx)}
              aria-label={`Quitar familiar ${idx + 1}`}
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-pill text-ink-500 transition-colors hover:bg-danger-50 hover:text-danger-700"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre" htmlFor={`fam-${idx}-nombre`} requerido>
              <Input id={`fam-${idx}-nombre`} placeholder="Juan" value={b.nombre} onChange={(e) => onActualizar(idx, 'nombre', e.target.value)} />
            </Field>
            <Field label="Apellido" htmlFor={`fam-${idx}-apellido`} requerido>
              <Input id={`fam-${idx}-apellido`} placeholder="García" value={b.apellido} onChange={(e) => onActualizar(idx, 'apellido', e.target.value)} />
            </Field>
            <Field label="DNI" htmlFor={`fam-${idx}-dni`} ayuda="Sin puntos ni espacios" requerido>
              <Input id={`fam-${idx}-dni`} inputMode="numeric" maxLength={8} placeholder="40123456" value={b.numeroDocumento} onChange={(e) => onActualizar(idx, 'numeroDocumento', soloDigitos(e.target.value))} />
            </Field>
            <Field label="Sexo" htmlFor={`fam-${idx}-sexo`} requerido>
              <Select
                id={`fam-${idx}-sexo`}
                opciones={OPCIONES_SEXO}
                value={b.sexo}
                onChange={(v) => onActualizar(idx, 'sexo', v)}
              />
            </Field>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Fecha de nacimiento" htmlFor={`fam-${idx}-fechanac`} requerido>
              <BirthDatePicker
                id={`fam-${idx}-fechanac`}
                value={b.fechaNacimiento}
                edadMinima={0}
                onChange={(iso) => onActualizar(idx, 'fechaNacimiento', iso)}
              />
            </Field>
            <Field label="Relación" htmlFor={`fam-${idx}-rel`} requerido>
              <Select
                id={`fam-${idx}-rel`}
                opciones={OPCIONES_RELACION}
                value={b.relacion}
                onChange={(v) => onActualizar(idx, 'relacion', v)}
              />
            </Field>
          </div>
        </div>
      ))}

      {familiaresCount < MAX_FAMILIARES ? (
        <Button type="button" variante="secundario" ancho="full" onClick={onAgregar} disabled={enviando}>
          <Plus size={16} aria-hidden="true" />
          Agregar familiar
        </Button>
      ) : (
        <p className="text-xs text-ink-500">Máximo {MAX_FAMILIARES} familiares.</p>
      )}

      <div className="flex items-center justify-between gap-3 rounded-card bg-marca-50 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-marca-700">Total mensual</p>
          <p className="text-xs text-ink-600">
            Titular{familiaresCount > 0 ? ` + ${familiaresCount} familiar${familiaresCount > 1 ? 'es' : ''}` : ''}
          </p>
        </div>
        <Money monto={total} periodo="por mes" tamano="md" />
      </div>

      {error ? <p className="text-sm text-danger-700">{error}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <Button type="submit" ancho="full" tamano="lg" className="sm:w-auto" disabled={enviando || !pasoValido}>
          {enviando ? 'Creando…' : 'Confirmar alta'}
        </Button>
        <Button type="button" variante="secundario" ancho="full" tamano="lg" className="sm:w-auto" onClick={onAtras} disabled={enviando}>
          Atrás
        </Button>
      </div>
    </form>
  );
}

interface ResumenProps {
  contacto: DatosContacto;
  total: number;
  familiaresCount: number;
  resultado: ResultadoOnboarding;
  modoQR: boolean;
}

function Resumen({ contacto, total, familiaresCount, resultado, modoQR }: ResumenProps) {
  const [copiado, setCopiado] = useState(false);
  // `modoQR` sigue existiendo para el acceso vía ?qr=true (vendedor en calle
  // que arranca directo con el QR arriba). El botón "Generar QR" permite el
  // mismo resultado desde el flujo normal sin cambiar la URL.
  const [mostrandoQR, setMostrandoQR] = useState(modoQR);

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(resultado.initPoint);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (err) {
      console.warn('[onboarding] no se pudo copiar', err);
    }
  }

  function pagarAhora() {
    window.location.href = resultado.initPoint;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-card bg-ok-50 px-4 py-3 ring-1 ring-ok-500/30">
        <p className="text-sm font-medium text-ok-700">Alta creada correctamente.</p>
        <p className="mt-1 text-sm text-ok-700">El cliente queda en el sistema. Falta el pago para activar la cobertura.</p>
      </div>

      <div className="flex flex-col gap-1 rounded-card bg-ink-50 px-4 py-3">
        <p className="text-sm text-ink-600">Cliente</p>
        <p className="text-base font-medium text-ink-900">{contacto.nombre} {contacto.apellido}</p>
        <p className="text-sm text-ink-600">{contacto.email}</p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-card bg-ink-50 px-4 py-3">
        <div>
          <p className="text-sm text-ink-600">{PLAN.nombre}</p>
          <p className="text-xs text-ink-500">Titular{familiaresCount > 0 ? ` + ${familiaresCount} familiar${familiaresCount > 1 ? 'es' : ''}` : ''}</p>
        </div>
        <Money monto={total} periodo="por mes" tamano="md" />
      </div>

      <div className="flex flex-col gap-3">
        <Button type="button" ancho="full" tamano="lg" onClick={pagarAhora}>
          <CreditCard size={16} aria-hidden="true" />
          Pagar ahora
        </Button>
        <Button type="button" variante="secundario" ancho="full" onClick={copiarLink}>
          {copiado ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          {copiado ? 'Link copiado' : 'Copiar link de pago'}
        </Button>
        <Button type="button" variante="secundario" ancho="full" onClick={() => setMostrandoQR((v) => !v)}>
          <QrCode size={16} aria-hidden="true" />
          {mostrandoQR ? 'Ocultar QR' : 'Generar QR'}
        </Button>
      </div>

      {mostrandoQR ? (
        <div className="flex flex-col items-center gap-4 rounded-card bg-white px-4 py-6 ring-1 ring-ink-200">
          <div className="flex items-center gap-2 text-sm font-medium text-ink-700">
            <QrCode size={16} aria-hidden="true" />
            Escaneá para pagar
          </div>
          <QR url={resultado.initPoint} lado={240} />
          <p className="max-w-xs text-center text-xs text-ink-500">El cliente escanea con la cámara del celular y completa el pago en MercadoPago.</p>
        </div>
      ) : null}
    </div>
  );
}
