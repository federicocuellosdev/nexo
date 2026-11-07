import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Users } from 'lucide-react';
import type { PerfilPrevinca } from '@/mock/session';
import { resetSession, setSession, useSession } from '@/mock/session';
import { desdePerfil, type PasoPerfil } from '@/features/perfil/validacion';
import { PerfilWizard, type DatosDelWizard } from '@/features/perfil/PerfilWizard';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { Button, clasesBoton } from '@/ui/Button';
import { Dialog } from '@/ui/Dialog';
import { Field } from '@/ui/Field';
import { Input } from '@/ui/Input';
import { iniciales, nombreVisible } from '@/lib/identidad';
import { landingUrl } from '@/lib/urls';

const ETIQUETA_SEXO: Record<'F' | 'M' | 'X', string> = {
  F: 'Femenino',
  M: 'Masculino',
  X: 'X',
};

const ETIQUETA_CONTRATACION: Record<PerfilPrevinca['tipoContratacion'], string> = {
  beneficiario: 'Beneficiario',
  tomador: 'Tomador',
  'tomador-beneficiario': 'Tomador y beneficiario',
};

function Seccion({
  titulo,
  onEditar,
  children,
}: {
  titulo: string;
  onEditar?: () => void;
  children: ReactNode;
}) {
  return (
    <section aria-label={titulo}>
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-medium text-ink-900">{titulo}</h2>
          {onEditar ? (
            <Button variante="fantasma" tamano="sm" onClick={onEditar}>
              Editar
            </Button>
          ) : null}
        </div>
        {children}
      </Card>
    </section>
  );
}

/** Fila etiqueta/valor para los bloques de solo lectura. */
function Dato({ etiqueta, valor }: { etiqueta: string; valor: ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-500">{etiqueta}</dt>
      <dd className="text-right text-ink-900">{valor}</dd>
    </div>
  );
}

function Interruptor({ id, label }: { id: string; label: string }) {
  const [activo, setActivo] = useState(true);
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-sm text-ink-700">
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={activo}
        onClick={() => setActivo((previo) => !previo)}
        className={`inline-flex h-6 w-11 shrink-0 items-center rounded-pill p-0.5 transition-colors duration-200 ${
          activo ? 'bg-marca-500' : 'bg-ink-200'
        }`}
      >
        <span
          className={`size-5 rounded-pill bg-white shadow-suave transition-transform duration-200 ease-out-quart ${
            activo ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

/**
 * Diálogo para editar sólo el email de MercadoPago.
 *
 * No vive en PerfilWizard porque `emailPago` no pertenece a `PerfilPrevinca` ni
 * al borrador de Previnca: es un dato del cobro, no de la póliza.
 */
function DialogoEmailPago({
  valorInicial,
  onGuardar,
  onCerrar,
}: {
  valorInicial: string;
  onGuardar: (email: string) => void;
  onCerrar: () => void;
}) {
  const [valor, setValor] = useState(valorInicial);
  const [error, setError] = useState<string | undefined>();

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const limpio = valor.trim();
    if (limpio === '') {
      setError('Ingresá un email');
      return;
    }
    // Validación mínima: hay un @ con algo a cada lado. No se replica el regex
    // de RFC completo porque la verificación real la hace MercadoPago cuando
    // vincule la cuenta.
    if (!/^\S+@\S+\.\S+$/.test(limpio)) {
      setError('Revisá el formato del email');
      return;
    }
    onGuardar(limpio);
  }

  return (
    <Dialog
      abierto
      onCambio={(abierto) => {
        if (!abierto) onCerrar();
      }}
      titulo="Email de facturación"
      descripcion="Es la cuenta de MercadoPago sobre la que se cobran las cuotas."
    >
      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        <Field label="Email de MercadoPago" htmlFor="facturacion-email" error={error} requerido>
          <Input
            id="facturacion-email"
            type="email"
            autoComplete="email"
            value={valor}
            invalido={error !== undefined}
            onChange={(evento) => {
              setValor(evento.target.value);
              if (error) setError(undefined);
            }}
          />
        </Field>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row-reverse">
          <Button type="submit" ancho="full" tamano="lg" className="sm:w-auto">
            Guardar cambios
          </Button>
          <Button
            type="button"
            variante="secundario"
            ancho="full"
            tamano="lg"
            className="sm:w-auto"
            onClick={onCerrar}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/** Card de perfil: avatar grande, nombre, apellido y familiares a cubrir. */
function TarjetaPerfil({
  usuario,
  familiares,
}: {
  usuario: ReturnType<typeof useSession>['usuario'];
  familiares: number | undefined;
}) {
  const [nombre, apellido] = [usuario?.nombre?.trim() ?? '', usuario?.apellido?.trim() ?? ''];
  const sinNombre = nombre === '' && apellido === '';

  return (
    <section aria-label="Perfil" className="lg:sticky lg:top-6 lg:self-start">
      <Card className="flex flex-col items-center gap-4 text-center">
        <span
          aria-hidden="true"
          className="inline-flex size-24 items-center justify-center rounded-pill bg-marca-600 text-2xl font-semibold text-white shadow-suave"
        >
          {iniciales(usuario)}
        </span>
        <div className="flex flex-col gap-1">
          {sinNombre ? (
            <p className="text-lg font-medium text-ink-900">{nombreVisible(usuario) || '—'}</p>
          ) : (
            <>
              <p className="text-lg font-medium text-ink-900">{nombre || '—'}</p>
              <p className="text-base text-ink-700">{apellido || '—'}</p>
            </>
          )}
          {usuario?.email ? <p className="text-xs text-ink-500">{usuario.email}</p> : null}
        </div>
        <div className="mt-2 flex w-full flex-col gap-1 border-t border-ink-100 pt-4">
          <div className="flex items-center justify-center gap-2 text-sm text-ink-700">
            <Users aria-hidden="true" className="size-4 text-ink-500" />
            <span>Familiares</span>
          </div>
          <p className="text-2xl font-semibold text-ink-950">{familiares ?? 0}</p>
          <p className="text-xs text-ink-500">adherentes al plan</p>
        </div>
      </Card>
    </section>
  );
}

export function Cuenta() {
  const sesion = useSession();
  const perfil = sesion.perfil;
  const usuario = sesion.usuario;
  const emailPago = sesion.emailPago;
  const familiares = sesion.familiares;
  const [pasoEditado, setPasoEditado] = useState<PasoPerfil | null>(null);
  const [editandoEmailPago, setEditandoEmailPago] = useState(false);

  function guardar({ perfil: actualizado, identidad }: DatosDelWizard) {
    // El nombre viaja a `usuario` y el resto a `perfil`: son dos destinos
    // distintos del store. Editar "Datos personales" desde acá ahora también
    // corrige el nombre, que es justo lo que le falta a quien entró por login.
    setSession({ perfil: actualizado, ...(usuario ? { usuario: { ...usuario, ...identidad } } : {}) });
    setPasoEditado(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl text-ink-950">Mi cuenta</h1>
        <p className="mt-1 text-sm text-ink-600">Tus datos, tu domicilio y tu facturación.</p>
      </div>

      {/* Columna de perfil + columna de datos. En mobile se apilan. */}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
        <TarjetaPerfil usuario={usuario} familiares={familiares} />

        <div className="flex flex-col gap-6">
          <Seccion titulo="Datos personales" onEditar={perfil ? () => setPasoEditado(2) : undefined}>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              <Dato etiqueta="Nombre" valor={usuario?.nombre ?? '—'} />
              <Dato etiqueta="Apellido" valor={usuario?.apellido ?? '—'} />
              <Dato etiqueta="Sexo" valor={perfil ? ETIQUETA_SEXO[perfil.sexo] : '—'} />
              <Dato etiqueta="Fecha de nacimiento" valor={perfil?.fechaNacimiento ?? '—'} />
            </dl>
          </Seccion>

          <Seccion titulo="Documento" onEditar={perfil ? () => setPasoEditado(1) : undefined}>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              <Dato etiqueta="Tipo de documento" valor={perfil?.tipoDocumento ?? '—'} />
              <Dato etiqueta="Número de documento" valor={perfil?.numeroDocumento ?? '—'} />
            </dl>
          </Seccion>

          <Seccion titulo="Contacto">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              <Dato etiqueta="Email" valor={usuario?.email ?? '—'} />
              <Dato etiqueta="Teléfono" valor={usuario?.telefono ?? '—'} />
            </dl>
          </Seccion>

          <Seccion titulo="Datos de domicilio" onEditar={perfil ? () => setPasoEditado(3) : undefined}>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              <Dato etiqueta="Calle" valor={perfil?.domicilio.calle ?? '—'} />
              <Dato etiqueta="Número" valor={perfil?.domicilio.numero ?? '—'} />
              <Dato etiqueta="Piso" valor={perfil?.domicilio.piso ?? '—'} />
              <Dato etiqueta="Departamento" valor={perfil?.domicilio.departamento ?? '—'} />
              <Dato etiqueta="Torre" valor={perfil?.domicilio.torre ?? '—'} />
              <Dato etiqueta="Localidad" valor={perfil?.domicilio.localidad ?? '—'} />
              <Dato etiqueta="Provincia" valor={perfil?.domicilio.provincia ?? '—'} />
              <Dato etiqueta="Código postal" valor={perfil?.domicilio.cp ?? '—'} />
              <Dato etiqueta="País" valor={perfil?.domicilio.pais ?? '—'} />
            </dl>
          </Seccion>

          <Seccion titulo="Datos de facturación" onEditar={() => setEditandoEmailPago(true)}>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              <Dato etiqueta="Email de MercadoPago" valor={emailPago ?? '—'} />
            </dl>
            <p className="text-xs text-ink-500">
              Cuenta sobre la que MercadoPago emite las facturas y envía los avisos de cobro.
            </p>
          </Seccion>
        </div>
      </div>

      {perfil ? (
        <Seccion titulo="Cobertura y contratación" onEditar={() => setPasoEditado(4)}>
          <div className="flex flex-col gap-2 text-sm text-ink-900">
            <div className="flex flex-wrap items-center gap-2">
              <span>
                {perfil.tieneObraSocial
                  ? `Obra social: ${perfil.obraSocial ?? 'sin especificar'}`
                  : 'Sin obra social'}
              </span>
              <Badge tono="warn">opcional · a definir</Badge>
            </div>
            <span>{ETIQUETA_CONTRATACION[perfil.tipoContratacion]}</span>
          </div>
        </Seccion>
      ) : null}

      <Seccion titulo="Notificaciones">
        <div className="flex flex-col gap-3">
          <Interruptor id="notif-email" label="Avisos por email" />
          <Interruptor id="notif-push" label="Recordatorio de vencimiento" />
          <p className="text-xs text-ink-500">sin efecto · demo</p>
        </div>
      </Seccion>

      <Seccion titulo="Sesión">
        <a
          href={landingUrl()}
          onClick={() => resetSession()}
          className={clasesBoton({ variante: 'peligro', tamano: 'sm', className: 'self-start' })}
        >
          Cerrar sesión
        </a>
      </Seccion>

      {pasoEditado !== null && perfil ? (
        <Dialog
          abierto
          onCambio={(abierto) => {
            if (!abierto) setPasoEditado(null);
          }}
          titulo="Editar tus datos"
        >
          <PerfilWizard
            pasoInicial={pasoEditado}
            borradorInicial={desdePerfil(perfil, usuario)}
            soloEstePaso
            onGuardar={guardar}
          />
        </Dialog>
      ) : null}

      {editandoEmailPago ? (
        <DialogoEmailPago
          valorInicial={emailPago ?? ''}
          onCerrar={() => setEditandoEmailPago(false)}
          onGuardar={(nuevo) => {
            setSession({ emailPago: nuevo });
            setEditandoEmailPago(false);
          }}
        />
      ) : null}
    </div>
  );
}
