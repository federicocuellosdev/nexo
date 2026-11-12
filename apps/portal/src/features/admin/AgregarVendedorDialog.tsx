import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { Dialog } from '@/ui/Dialog';
import { Field } from '@/ui/Field';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { supabase } from '@/lib/supabase';
import { crearVendedorAdmin, ApiError } from '@/lib/api';
import { SelectorEtiqueta } from '@/features/admin/SelectorEtiqueta';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface AgregarVendedorDialogProps {
  onCerrar: () => void;
  /** Se llama con el id del nuevo vendedor cuando el POST termina OK. */
  onCreado: (id: string) => void;
}

type Paso = 1 | 2;

/**
 * Alta de un vendedor desde el admin, dividida en dos pasos:
 *   1. Datos personales (nombre, apellido, email, teléfono, DNI).
 *   2. Etiqueta (combobox) + confirmación.
 *
 * El backend genera `codigo_corto` + manda email de bienvenida con magic
 * link al vendedor automáticamente — este dialog solo recibe el id del
 * vendedor creado y cierra.
 */
export function AgregarVendedorDialog({ onCerrar, onCreado }: AgregarVendedorDialogProps) {
  const [paso, setPaso] = useState<Paso>(1);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [etiqueta, setEtiqueta] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  function validarPaso1(): string | undefined {
    if (nombre.trim() === '' || apellido.trim() === '') return 'Nombre y apellido son obligatorios';
    if (!EMAIL.test(email.trim())) return 'Revisá el formato del email';
    return undefined;
  }

  function avanzar(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const err = validarPaso1();
    if (err) {
      setError(err);
      return;
    }
    setError(undefined);
    setPaso(2);
  }

  async function crear(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (guardando) return;
    setError(undefined);
    setGuardando(true);
    try {
      if (!supabase) throw new Error('supabase no configurado');
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('sesión expirada');
      const id = await crearVendedorAdmin(token, {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim(),
        dni: dni.trim() || undefined,
        telefono: telefono.trim() || undefined,
        etiqueta: etiqueta.trim() || undefined,
      });
      onCreado(id);
    } catch (err) {
      console.error('[AgregarVendedorDialog] error', err);
      if (err instanceof ApiError && err.cuerpo.error === 'email_ya_registrado') {
        setError('Ya existe un vendedor con ese email.');
        setPaso(1);
      } else {
        setError('No pudimos crear el vendedor. Probá de nuevo.');
      }
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Dialog
      abierto
      onCambio={(abierto) => {
        if (!abierto) onCerrar();
      }}
      titulo="Nuevo vendedor"
      descripcion={
        paso === 1
          ? 'Paso 1 de 2 — Datos personales del partner comercial.'
          : 'Paso 2 de 2 — Etiqueta y confirmación. Le vamos a mandar un email con un magic link para que acceda al panel.'
      }
    >
      <IndicadorPasos paso={paso} />

      {paso === 1 ? (
        <form onSubmit={avanzar} noValidate className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" htmlFor="agregar-nombre" requerido>
              <Input id="agregar-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
            </Field>
            <Field label="Apellido" htmlFor="agregar-apellido" requerido>
              <Input id="agregar-apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} />
            </Field>
            <Field label="Email" htmlFor="agregar-email" requerido>
              <Input
                id="agregar-email"
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Teléfono" htmlFor="agregar-telefono">
              <Input
                id="agregar-telefono"
                inputMode="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </Field>
            <Field label="DNI" htmlFor="agregar-dni">
              <Input id="agregar-dni" inputMode="numeric" value={dni} onChange={(e) => setDni(e.target.value)} />
            </Field>
          </div>

          {error ? <p className="text-sm text-danger-700">{error}</p> : null}

          <div className="mt-2 flex flex-col gap-3 sm:flex-row-reverse">
            <Button type="submit" ancho="full" tamano="lg" className="sm:w-auto">
              Siguiente
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
      ) : (
        <form onSubmit={crear} noValidate className="flex flex-col gap-4">
          <Field
            label="Etiqueta"
            htmlFor="agregar-etiqueta"
            ayuda="Agrupá vendedores por canal (ej. PREVINCA, Externos). Si no existe, podés crearla acá mismo."
          >
            <SelectorEtiqueta id="agregar-etiqueta" valor={etiqueta} onCambio={setEtiqueta} />
          </Field>

          <ResumenVendedor
            nombre={nombre}
            apellido={apellido}
            email={email}
            dni={dni}
            telefono={telefono}
            etiqueta={etiqueta}
          />

          {error ? <p className="text-sm text-danger-700">{error}</p> : null}

          <div className="mt-2 flex flex-col gap-3 sm:flex-row-reverse">
            <Button type="submit" ancho="full" tamano="lg" className="sm:w-auto" disabled={guardando}>
              {guardando ? 'Creando…' : 'Crear vendedor y mandar email'}
            </Button>
            <Button
              type="button"
              variante="secundario"
              ancho="full"
              tamano="lg"
              className="sm:w-auto"
              onClick={() => setPaso(1)}
              disabled={guardando}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Volver
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

function IndicadorPasos({ paso }: { paso: Paso }) {
  return (
    <ol className="mb-5 flex items-center gap-2" aria-label="Progreso">
      {[1, 2].map((n) => {
        const activo = paso === n;
        const completado = paso > n;
        return (
          <li key={n} className="flex flex-1 items-center gap-2">
            <span
              aria-current={activo ? 'step' : undefined}
              className={[
                'inline-flex size-6 shrink-0 items-center justify-center rounded-pill text-xs font-medium',
                completado
                  ? 'bg-marca-600 text-white'
                  : activo
                    ? 'bg-marca-100 text-marca-800 ring-2 ring-marca-400'
                    : 'bg-ink-100 text-ink-500',
              ].join(' ')}
            >
              {completado ? <Check size={12} /> : n}
            </span>
            <span className="h-0.5 flex-1 rounded-pill bg-ink-100">
              <span
                className={[
                  'block h-full rounded-pill transition-all',
                  completado || activo ? 'bg-marca-400' : 'bg-transparent',
                ].join(' ')}
                style={{ width: completado ? '100%' : activo ? '50%' : '0%' }}
              />
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ResumenVendedor({
  nombre,
  apellido,
  email,
  dni,
  telefono,
  etiqueta,
}: {
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  telefono: string;
  etiqueta: string;
}) {
  return (
    <dl className="grid gap-x-6 gap-y-2 rounded-campo bg-ink-50 p-4 text-sm sm:grid-cols-2">
      <div className="flex justify-between gap-3">
        <dt className="text-ink-500">Nombre</dt>
        <dd className="truncate text-right text-ink-900">
          {nombre} {apellido}
        </dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-ink-500">Email</dt>
        <dd className="truncate text-right text-ink-900">{email}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-ink-500">DNI</dt>
        <dd className="truncate text-right text-ink-900">{dni || '—'}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-ink-500">Teléfono</dt>
        <dd className="truncate text-right text-ink-900">{telefono || '—'}</dd>
      </div>
      <div className="flex justify-between gap-3 sm:col-span-2">
        <dt className="text-ink-500">Etiqueta</dt>
        <dd className="truncate text-right text-ink-900">{etiqueta || '—'}</dd>
      </div>
    </dl>
  );
}
