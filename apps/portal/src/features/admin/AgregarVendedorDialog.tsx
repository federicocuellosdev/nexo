import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, Check, MailCheck } from 'lucide-react';
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
 * Alta de un vendedor desde el admin, dividida en dos pasos + una pantalla
 * de confirmación:
 *   1. Datos personales (nombre, apellido, email, teléfono).
 *   2. Etiqueta (combobox) + DNI.
 *   Éxito: se muestra una pantalla con ícono + mensaje de confirmación.
 *     El onCreado se dispara recién cuando el usuario toca "Listo", así ve
 *     el feedback de que la acción terminó y que salió el email.
 *
 * El backend genera `codigo_corto` + manda email de bienvenida con magic
 * link al vendedor automáticamente.
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
  // Cuando el POST termina OK, en vez de cerrar directo guardamos el id acá
  // y pasamos al estado de éxito. El parent se entera recién en "Listo".
  const [creadoId, setCreadoId] = useState<string | undefined>(undefined);

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
      setCreadoId(id);
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

  const enExito = creadoId !== undefined;

  return (
    <Dialog
      abierto
      onCambio={(abierto) => {
        // Si se cierra el dialog estando en éxito, igual avisamos al parent
        // así refresca la lista — si no, el vendedor recién creado no
        // aparecería hasta que el admin recargue.
        if (!abierto) {
          if (enExito && creadoId) onCreado(creadoId);
          else onCerrar();
        }
      }}
      titulo={enExito ? 'Vendedor creado' : 'Nuevo vendedor'}
      descripcion={
        enExito
          ? undefined
          : paso === 1
            ? 'Paso 1 de 2 — Datos personales del partner comercial.'
            : 'Paso 2 de 2 — Etiqueta y DNI. Le vamos a mandar un email con un magic link para que acceda al panel.'
      }
    >
      {enExito ? (
        <PantallaExito email={email} onListo={() => creadoId && onCreado(creadoId)} />
      ) : (
        <>
          <IndicadorPasos paso={paso} />
          {paso === 1 ? (
        <form onSubmit={avanzar} noValidate className="flex flex-col gap-4">
          {/* Fila 1: nombre + apellido (grid 2-cols). Fila 2 y 3: email y
              teléfono cada uno a ancho completo — más legible que un grid
              de 4 inputs amontonados. DNI y etiqueta se piden en paso 2. */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" htmlFor="agregar-nombre" requerido>
              <Input id="agregar-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
            </Field>
            <Field label="Apellido" htmlFor="agregar-apellido" requerido>
              <Input id="agregar-apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} />
            </Field>
          </div>
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

          <Field label="DNI" htmlFor="agregar-dni">
            <Input id="agregar-dni" inputMode="numeric" value={dni} onChange={(e) => setDni(e.target.value)} />
          </Field>

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
        </>
      )}
    </Dialog>
  );
}

function PantallaExito({ email, onListo }: { email: string; onListo: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <span
        aria-hidden="true"
        className="inline-flex size-14 items-center justify-center rounded-pill bg-ok-50 text-ok-700 ring-1 ring-ok-500/30"
      >
        <MailCheck size={28} strokeWidth={1.75} />
      </span>
      <div>
        <p className="font-display text-xl text-ink-950">Vendedor creado</p>
        <p className="mt-1 text-sm text-ink-600">
          Le enviamos un email a <strong className="font-medium text-ink-900">{email}</strong> con un
          magic link para que acceda al panel.
        </p>
      </div>
      <Button type="button" tamano="lg" onClick={onListo} className="mt-2 min-w-[140px]">
        Listo
      </Button>
    </div>
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
                    ? 'bg-marca-100 text-marca-800 ring-1 ring-marca-300'
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

