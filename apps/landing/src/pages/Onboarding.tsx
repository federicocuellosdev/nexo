import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { Copy, Check, CreditCard, QrCode, Trash2, Plus } from 'lucide-react';
import { Card } from '@/ui/Card';
import { Field } from '@/ui/Field';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
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

type Paso = 1 | 2 | 3 | 4 | 5;

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
  localidad: 'Rosario',
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

  const [paso, setPaso] = useState<Paso>(1);
  const [contacto, setContacto] = useState<DatosContacto>(CONTACTO_VACIO);
  const [documento, setDocumento] = useState<DatosDocumento>(DOCUMENTO_VACIO);
  const [domicilio, setDomicilio] = useState<DatosDomicilio>(DOMICILIO_VACIO);
  const [beneficiarios, setBeneficiarios] = useState<BeneficiarioForm[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoOnboarding | null>(null);

  const total = PLAN.precio * (1 + beneficiarios.length);

  function validar(p: Paso): string | null {
    if (p === 1) {
      const c = contacto;
      if (!c.nombre.trim()) return 'Ingresá el nombre';
      if (!c.apellido.trim()) return 'Ingresá el apellido';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email.trim())) return 'Revisá el email';
      if (!/^\d{8,15}$/.test(c.telefono.trim())) return 'Teléfono debe ser 8-15 dígitos';
      return null;
    }
    if (p === 2) {
      const d = documento;
      if (!/^\d{7,8}$/.test(d.dni.trim())) return 'DNI debe ser 7-8 dígitos';
      if (!d.fechaNacimiento) return 'Ingresá la fecha de nacimiento';
      if (d.sexo === '') return 'Seleccioná el sexo';
      return null;
    }
    if (p === 3) {
      const d = domicilio;
      if (!d.calle.trim()) return 'Ingresá la calle';
      if (!d.numero.trim()) return 'Ingresá el número';
      if (!d.localidad.trim()) return 'Ingresá la localidad';
      if (!d.provincia.trim()) return 'Ingresá la provincia';
      if (!d.cp.trim()) return 'Ingresá el código postal';
      return null;
    }
    if (p === 4) {
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

    if (paso < 4) {
      setPaso((paso + 1) as Paso);
      return;
    }

    // Paso 4 → envío al backend (crea lead + perfil + MP sub)
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
      setPaso(5);
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
      <h1 className="text-2xl text-ink-950">Onboarding Previnca Nexo</h1>
      <p className="mt-2 text-sm text-ink-600">
        Cargá los datos del cliente. Al terminar te mostramos el {modoQR ? 'QR' : 'link'} para pagar.
      </p>

      <Card className="mt-6 flex flex-col gap-5">
        <Indicador paso={paso} />

        {paso === 1 ? (
          <FormContacto datos={contacto} onCambio={setContacto} onSubmit={avanzar} error={error} enviando={enviando} />
        ) : paso === 2 ? (
          <FormDocumento datos={documento} onCambio={setDocumento} onAtras={volver} onSubmit={avanzar} error={error} enviando={enviando} />
        ) : paso === 3 ? (
          <FormDomicilio datos={domicilio} onCambio={setDomicilio} onAtras={volver} onSubmit={avanzar} error={error} enviando={enviando} />
        ) : paso === 4 ? (
          <FormFamiliares
            beneficiarios={beneficiarios}
            onAgregar={agregarBeneficiario}
            onQuitar={quitarBeneficiario}
            onActualizar={actualizarBeneficiario}
            onAtras={volver}
            onSubmit={avanzar}
            error={error}
            enviando={enviando}
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
  const titulo = paso === 1 ? 'Datos del titular' : paso === 2 ? 'Documento' : paso === 3 ? 'Domicilio' : paso === 4 ? 'Familiares' : 'Listo';
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-ink-500">{`Paso ${paso} de 5`}</span>
        <span className="text-sm text-ink-600">{titulo}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={paso}
        aria-valuemin={1}
        aria-valuemax={5}
        aria-label="Progreso del onboarding"
        className="mt-3 flex items-center gap-2"
      >
        {[1, 2, 3, 4, 5].map((n) => (
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
}

function FormContacto({ datos, onCambio, onSubmit, error, enviando }: PasoProps<DatosContacto>) {
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
          <Input id="onb-nombre" value={datos.nombre} onChange={(e) => onCambio({ ...datos, nombre: e.target.value })} />
        </Field>
        <Field label="Apellido" htmlFor="onb-apellido" requerido>
          <Input id="onb-apellido" value={datos.apellido} onChange={(e) => onCambio({ ...datos, apellido: e.target.value })} />
        </Field>
      </div>
      <Field label="Email" htmlFor="onb-email" requerido>
        <Input id="onb-email" type="email" inputMode="email" value={datos.email} onChange={(e) => onCambio({ ...datos, email: e.target.value })} />
      </Field>
      <Field label="Teléfono" htmlFor="onb-telefono" requerido>
        <Input id="onb-telefono" inputMode="tel" value={datos.telefono} onChange={(e) => onCambio({ ...datos, telefono: e.target.value })} />
      </Field>
      {error ? <p className="text-sm text-danger-700">{error}</p> : null}
      <Button type="submit" ancho="full" tamano="lg" disabled={enviando}>
        Continuar
      </Button>
    </form>
  );
}

function FormDocumento({ datos, onCambio, onAtras, onSubmit, error, enviando }: PasoProps<DatosDocumento>) {
  useEffect(() => {
    document.getElementById('onb-dni')?.focus();
  }, []);
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="DNI" htmlFor="onb-dni" requerido>
          <Input id="onb-dni" inputMode="numeric" value={datos.dni} onChange={(e) => onCambio({ ...datos, dni: e.target.value })} />
        </Field>
        <Field label="Fecha de nacimiento" htmlFor="onb-fechanac" requerido>
          <Input id="onb-fechanac" type="date" value={datos.fechaNacimiento} onChange={(e) => onCambio({ ...datos, fechaNacimiento: e.target.value })} />
        </Field>
        <Field label="Sexo" htmlFor="onb-sexo" requerido>
          <select
            id="onb-sexo"
            value={datos.sexo}
            onChange={(e) => onCambio({ ...datos, sexo: e.target.value as DatosDocumento['sexo'] })}
            className="h-11 w-full rounded-campo bg-white px-3 text-base text-ink-900 ring-1 ring-ink-200 focus:outline-none focus:ring-2 focus:ring-marca-500"
          >
            <option value="">—</option>
            <option value="F">Femenino</option>
            <option value="M">Masculino</option>
            <option value="X">Otro</option>
          </select>
        </Field>
      </div>
      {error ? <p className="text-sm text-danger-700">{error}</p> : null}
      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <Button type="submit" ancho="full" tamano="lg" className="sm:w-auto" disabled={enviando}>
          Continuar
        </Button>
        <Button type="button" variante="secundario" ancho="full" tamano="lg" className="sm:w-auto" onClick={onAtras} disabled={enviando}>
          Atrás
        </Button>
      </div>
    </form>
  );
}

function FormDomicilio({ datos, onCambio, onAtras, onSubmit, error, enviando }: PasoProps<DatosDomicilio>) {
  useEffect(() => {
    document.getElementById('onb-calle')?.focus();
  }, []);
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Calle" htmlFor="onb-calle" requerido>
          <Input id="onb-calle" value={datos.calle} onChange={(e) => onCambio({ ...datos, calle: e.target.value })} />
        </Field>
        <Field label="Número" htmlFor="onb-numero" requerido>
          <Input id="onb-numero" inputMode="numeric" value={datos.numero} onChange={(e) => onCambio({ ...datos, numero: e.target.value })} />
        </Field>
        <Field label="Piso" htmlFor="onb-piso">
          <Input id="onb-piso" value={datos.piso} onChange={(e) => onCambio({ ...datos, piso: e.target.value })} />
        </Field>
        <Field label="Depto" htmlFor="onb-depto">
          <Input id="onb-depto" value={datos.departamento} onChange={(e) => onCambio({ ...datos, departamento: e.target.value })} />
        </Field>
        <Field label="Localidad" htmlFor="onb-loc" requerido>
          <Input id="onb-loc" value={datos.localidad} onChange={(e) => onCambio({ ...datos, localidad: e.target.value })} />
        </Field>
        <Field label="Provincia" htmlFor="onb-prov" requerido>
          <Input id="onb-prov" value={datos.provincia} onChange={(e) => onCambio({ ...datos, provincia: e.target.value })} />
        </Field>
        <Field label="Código postal" htmlFor="onb-cp" requerido>
          <Input id="onb-cp" inputMode="numeric" value={datos.cp} onChange={(e) => onCambio({ ...datos, cp: e.target.value })} />
        </Field>
      </div>
      {error ? <p className="text-sm text-danger-700">{error}</p> : null}
      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <Button type="submit" ancho="full" tamano="lg" className="sm:w-auto" disabled={enviando}>
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
              <Input id={`fam-${idx}-nombre`} value={b.nombre} onChange={(e) => onActualizar(idx, 'nombre', e.target.value)} />
            </Field>
            <Field label="Apellido" htmlFor={`fam-${idx}-apellido`} requerido>
              <Input id={`fam-${idx}-apellido`} value={b.apellido} onChange={(e) => onActualizar(idx, 'apellido', e.target.value)} />
            </Field>
            <Field label="DNI" htmlFor={`fam-${idx}-dni`} requerido>
              <Input id={`fam-${idx}-dni`} inputMode="numeric" value={b.numeroDocumento} onChange={(e) => onActualizar(idx, 'numeroDocumento', e.target.value)} />
            </Field>
            <Field label="Fecha de nacimiento" htmlFor={`fam-${idx}-fechanac`} requerido>
              <Input id={`fam-${idx}-fechanac`} type="date" value={b.fechaNacimiento} onChange={(e) => onActualizar(idx, 'fechaNacimiento', e.target.value)} />
            </Field>
            <Field label="Sexo" htmlFor={`fam-${idx}-sexo`} requerido>
              <select
                id={`fam-${idx}-sexo`}
                value={b.sexo}
                onChange={(e) => onActualizar(idx, 'sexo', e.target.value)}
                className="h-11 w-full rounded-campo bg-white px-3 text-base text-ink-900 ring-1 ring-ink-200 focus:outline-none focus:ring-2 focus:ring-marca-500"
              >
                <option value="F">Femenino</option>
                <option value="M">Masculino</option>
                <option value="X">Otro</option>
              </select>
            </Field>
            <Field label="Relación" htmlFor={`fam-${idx}-rel`} requerido>
              <select
                id={`fam-${idx}-rel`}
                value={b.relacion}
                onChange={(e) => onActualizar(idx, 'relacion', e.target.value)}
                className="h-11 w-full rounded-campo bg-white px-3 text-base text-ink-900 ring-1 ring-ink-200 focus:outline-none focus:ring-2 focus:ring-marca-500"
              >
                <option value="conyuge">Cónyuge</option>
                <option value="hijo">Hijo/a</option>
                <option value="padre">Padre</option>
                <option value="madre">Madre</option>
                <option value="otro">Otro</option>
              </select>
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
        <Button type="submit" ancho="full" tamano="lg" className="sm:w-auto" disabled={enviando}>
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

      {modoQR ? (
        <div className="flex flex-col items-center gap-4 rounded-card bg-white px-4 py-6 ring-1 ring-ink-200">
          <div className="flex items-center gap-2 text-sm font-medium text-ink-700">
            <QrCode size={16} aria-hidden="true" />
            Escaneá para pagar
          </div>
          <QR url={resultado.initPoint} lado={240} />
          <p className="max-w-xs text-center text-xs text-ink-500">El cliente escanea con la cámara del celular y completa el pago en MercadoPago.</p>
          <Button type="button" variante="secundario" ancho="full" onClick={copiarLink}>
            {copiado ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            {copiado ? 'Copiado' : 'Compartir link de pago'}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Button type="button" ancho="full" tamano="lg" onClick={pagarAhora}>
            <CreditCard size={16} aria-hidden="true" />
            Pagar ahora
          </Button>
          <Button type="button" variante="secundario" ancho="full" onClick={copiarLink}>
            {copiado ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            {copiado ? 'Link copiado' : 'Copiar link de pago'}
          </Button>
        </div>
      )}
    </div>
  );
}
