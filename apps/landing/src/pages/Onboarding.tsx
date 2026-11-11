import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { Copy, Check, CreditCard, QrCode } from 'lucide-react';
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
} from '@/lib/api';

/**
 * Onboarding público usado por vendedores afiliados para cargar leads en
 * la calle. Encadena los 3 endpoints existentes (/leads + /leads/:id/perfil
 * + /subscriptions) y muestra un resumen final con:
 *  - QR del init_point de MP si viene con ?qr=true (para que el cliente
 *    escanee desde su celular y pague).
 *  - Botón "Pagar" que redirige directo a MP si ?qr no está (compatible
 *    con el flujo tradicional desde el landing público).
 *
 * El afiliado atribuido se pasa en ?ref={afiliadoId}. El backend todavía
 * no persiste la atribución — la URL queda igual armada y se puede leer
 * a futuro cuando se implemente.
 */

const PLAN = PLANES[0];

type Paso = 1 | 2 | 3;

interface DatosTitular {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  dni: string;
  fechaNacimiento: string; // YYYY-MM-DD
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

const TITULAR_VACIO: DatosTitular = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  dni: '',
  fechaNacimiento: '',
  sexo: '',
};

const DOMICILIO_VACIO: DatosDomicilio = {
  calle: '',
  numero: '',
  piso: '',
  departamento: '',
  localidad: 'Rosario',
  provincia: 'Santa Fe',
  cp: '',
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
  const [titular, setTitular] = useState<DatosTitular>(TITULAR_VACIO);
  const [domicilio, setDomicilio] = useState<DatosDomicilio>(DOMICILIO_VACIO);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoOnboarding | null>(null);

  function validarPaso1(): string | null {
    const t = titular;
    if (!t.nombre.trim()) return 'Ingresá el nombre';
    if (!t.apellido.trim()) return 'Ingresá el apellido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t.email.trim())) return 'Revisá el email';
    if (!/^\d{8,15}$/.test(t.telefono.trim())) return 'Teléfono debe ser 8-15 dígitos';
    if (!/^\d{7,8}$/.test(t.dni.trim())) return 'DNI debe ser 7-8 dígitos';
    if (!t.fechaNacimiento) return 'Ingresá la fecha de nacimiento';
    if (t.sexo === '') return 'Seleccioná el sexo';
    return null;
  }

  function validarPaso2(): string | null {
    const d = domicilio;
    if (!d.calle.trim()) return 'Ingresá la calle';
    if (!d.numero.trim()) return 'Ingresá el número';
    if (!d.localidad.trim()) return 'Ingresá la localidad';
    if (!d.provincia.trim()) return 'Ingresá la provincia';
    if (!d.cp.trim()) return 'Ingresá el código postal';
    return null;
  }

  async function avanzar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando) return;

    if (paso === 1) {
      const err = validarPaso1();
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      setPaso(2);
      return;
    }

    if (paso === 2) {
      const err = validarPaso2();
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      setEnviando(true);
      try {
        // 1. Crear lead
        const resLead = await crearLead({
          tipo: 'plan',
          itemId: PLAN.slug,
          itemNombre: PLAN.nombre,
          nombre: titular.nombre.trim(),
          apellido: titular.apellido.trim(),
          email: titular.email.trim(),
          telefono: titular.telefono.trim(),
          dni: titular.dni.trim(),
        });

        // 2. Guardar perfil (habilita sale_intake cuando se confirme el pago)
        await guardarPerfilOnboarding(resLead.leadId, {
          perfil: {
            tipoDocumento: 'DNI',
            numeroDocumento: titular.dni.trim(),
            sexo: titular.sexo as 'F' | 'M' | 'X',
            fechaNacimiento: titular.fechaNacimiento,
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
          beneficiarios: [],
          familiaresCount: 0,
        });

        // 3. Crear subscripción MP
        const resMp = await crearSuscripcionOnboarding({
          planId: PLAN.slug,
          planNombre: PLAN.nombre,
          monto: PLAN.precio,
          emailMp: titular.email.trim(),
          leadId: resLead.leadId,
        });

        setResultado({
          leadId: resLead.leadId,
          initPoint: resMp.initPoint,
          preapprovalId: resMp.preapprovalId,
        });
        setPaso(3);
      } catch (err) {
        console.error('[onboarding] error', err);
        if (err instanceof ApiError) {
          if (err.cuerpo.error === 'mp_no_configurado') {
            setError('MercadoPago no está configurado. Avisá a soporte.');
          } else {
            setError('No pudimos completar el alta. Revisá los datos e intentá de nuevo.');
          }
        } else {
          setError('No pudimos conectar con el servidor. Revisá tu conexión.');
        }
      } finally {
        setEnviando(false);
      }
    }
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
          <FormTitular
            datos={titular}
            onCambio={setTitular}
            onSubmit={avanzar}
            error={error}
            enviando={enviando}
          />
        ) : paso === 2 ? (
          <FormDomicilio
            datos={domicilio}
            onCambio={setDomicilio}
            onAtras={() => {
              setPaso(1);
              setError(null);
            }}
            onSubmit={avanzar}
            error={error}
            enviando={enviando}
          />
        ) : resultado ? (
          <Resumen titular={titular} resultado={resultado} modoQR={modoQR} />
        ) : null}
      </Card>
    </div>
  );
}

function Indicador({ paso }: { paso: Paso }) {
  const titulo = paso === 1 ? 'Datos del titular' : paso === 2 ? 'Domicilio' : 'Listo';
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-ink-500">{`Paso ${paso} de 3`}</span>
        <span className="text-sm text-ink-600">{titulo}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={paso}
        aria-valuemin={1}
        aria-valuemax={3}
        aria-label="Progreso del onboarding"
        className="mt-3 flex items-center gap-2"
      >
        {[1, 2, 3].map((n) => (
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

interface FormProps<T> {
  datos: T;
  onCambio: (datos: T) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  error: string | null;
  enviando: boolean;
}

function FormTitular({
  datos,
  onCambio,
  onSubmit,
  error,
  enviando,
}: FormProps<DatosTitular>) {
  useEffect(() => {
    document.getElementById('onb-nombre')?.focus();
  }, []);

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" htmlFor="onb-nombre" requerido>
          <Input
            id="onb-nombre"
            value={datos.nombre}
            onChange={(e) => onCambio({ ...datos, nombre: e.target.value })}
          />
        </Field>
        <Field label="Apellido" htmlFor="onb-apellido" requerido>
          <Input
            id="onb-apellido"
            value={datos.apellido}
            onChange={(e) => onCambio({ ...datos, apellido: e.target.value })}
          />
        </Field>
        <Field label="Email" htmlFor="onb-email" requerido>
          <Input
            id="onb-email"
            type="email"
            inputMode="email"
            value={datos.email}
            onChange={(e) => onCambio({ ...datos, email: e.target.value })}
          />
        </Field>
        <Field label="Teléfono" htmlFor="onb-telefono" requerido>
          <Input
            id="onb-telefono"
            inputMode="tel"
            value={datos.telefono}
            onChange={(e) => onCambio({ ...datos, telefono: e.target.value })}
          />
        </Field>
        <Field label="DNI" htmlFor="onb-dni" requerido>
          <Input
            id="onb-dni"
            inputMode="numeric"
            value={datos.dni}
            onChange={(e) => onCambio({ ...datos, dni: e.target.value })}
          />
        </Field>
        <Field label="Fecha de nacimiento" htmlFor="onb-fechanac" requerido>
          <Input
            id="onb-fechanac"
            type="date"
            value={datos.fechaNacimiento}
            onChange={(e) => onCambio({ ...datos, fechaNacimiento: e.target.value })}
          />
        </Field>
        <Field label="Sexo" htmlFor="onb-sexo" requerido>
          <select
            id="onb-sexo"
            value={datos.sexo}
            onChange={(e) => onCambio({ ...datos, sexo: e.target.value as DatosTitular['sexo'] })}
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

      <Button type="submit" ancho="full" tamano="lg" disabled={enviando}>
        Continuar
      </Button>
    </form>
  );
}

interface FormDomicilioProps extends FormProps<DatosDomicilio> {
  onAtras: () => void;
}

function FormDomicilio({ datos, onCambio, onSubmit, onAtras, error, enviando }: FormDomicilioProps) {
  useEffect(() => {
    document.getElementById('onb-calle')?.focus();
  }, []);

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Calle" htmlFor="onb-calle" requerido>
          <Input
            id="onb-calle"
            value={datos.calle}
            onChange={(e) => onCambio({ ...datos, calle: e.target.value })}
          />
        </Field>
        <Field label="Número" htmlFor="onb-numero" requerido>
          <Input
            id="onb-numero"
            inputMode="numeric"
            value={datos.numero}
            onChange={(e) => onCambio({ ...datos, numero: e.target.value })}
          />
        </Field>
        <Field label="Piso" htmlFor="onb-piso">
          <Input
            id="onb-piso"
            value={datos.piso}
            onChange={(e) => onCambio({ ...datos, piso: e.target.value })}
          />
        </Field>
        <Field label="Depto" htmlFor="onb-depto">
          <Input
            id="onb-depto"
            value={datos.departamento}
            onChange={(e) => onCambio({ ...datos, departamento: e.target.value })}
          />
        </Field>
        <Field label="Localidad" htmlFor="onb-loc" requerido>
          <Input
            id="onb-loc"
            value={datos.localidad}
            onChange={(e) => onCambio({ ...datos, localidad: e.target.value })}
          />
        </Field>
        <Field label="Provincia" htmlFor="onb-prov" requerido>
          <Input
            id="onb-prov"
            value={datos.provincia}
            onChange={(e) => onCambio({ ...datos, provincia: e.target.value })}
          />
        </Field>
        <Field label="Código postal" htmlFor="onb-cp" requerido>
          <Input
            id="onb-cp"
            inputMode="numeric"
            value={datos.cp}
            onChange={(e) => onCambio({ ...datos, cp: e.target.value })}
          />
        </Field>
      </div>

      {error ? <p className="text-sm text-danger-700">{error}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <Button type="submit" ancho="full" tamano="lg" className="sm:w-auto" disabled={enviando}>
          {enviando ? 'Creando…' : 'Confirmar alta'}
        </Button>
        <Button
          type="button"
          variante="secundario"
          ancho="full"
          tamano="lg"
          className="sm:w-auto"
          onClick={onAtras}
          disabled={enviando}
        >
          Atrás
        </Button>
      </div>
    </form>
  );
}

interface ResumenProps {
  titular: DatosTitular;
  resultado: ResultadoOnboarding;
  modoQR: boolean;
}

function Resumen({ titular, resultado, modoQR }: ResumenProps) {
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
        <p className="mt-1 text-sm text-ok-700">
          El cliente queda en el sistema. Falta el pago para activar la cobertura.
        </p>
      </div>

      <div className="flex flex-col gap-1 rounded-card bg-ink-50 px-4 py-3">
        <p className="text-sm text-ink-600">Cliente</p>
        <p className="text-base font-medium text-ink-900">
          {titular.nombre} {titular.apellido}
        </p>
        <p className="text-sm text-ink-600">{titular.email}</p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-card bg-ink-50 px-4 py-3">
        <div>
          <p className="text-sm text-ink-600">{PLAN.nombre}</p>
          <p className="text-xs text-ink-500">Suscripción mensual</p>
        </div>
        <Money monto={PLAN.precio} periodo="por mes" tamano="md" />
      </div>

      {modoQR ? (
        <div className="flex flex-col items-center gap-4 rounded-card bg-white px-4 py-6 ring-1 ring-ink-200">
          <div className="flex items-center gap-2 text-sm font-medium text-ink-700">
            <QrCode size={16} aria-hidden="true" />
            Escaneá para pagar
          </div>
          <QR url={resultado.initPoint} lado={240} />
          <p className="max-w-xs text-center text-xs text-ink-500">
            El cliente escanea con la cámara del celular y completa el pago en MercadoPago.
          </p>
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
