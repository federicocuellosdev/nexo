import { useState } from 'react';
import type { FormEvent } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Dialog } from '@/ui/Dialog';
import { Field } from '@/ui/Field';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';

export interface DialogoInvitarProps {
  onCerrar: () => void;
  /** Async: devolver promise permite mostrar "Enviando…" en el botón. Si
   *  rechaza, mantenemos el form abierto con un error al pie. */
  onEnviar: (email: string) => Promise<void>;
}

/**
 * Diálogo para invitar a un amigo al programa de referidos. Dos estados
 * mutuamente excluyentes:
 *   1. Formulario: un input de email + CTA 'Enviar invitación'.
 *   2. Éxito: se reemplaza TODO el contenido del dialog por un ícono grande
 *      + un mensaje breve (no un banner superpuesto al formulario viejo —
 *      eso confundía al lector sobre qué pasó realmente).
 */
export function DialogoInvitar({ onCerrar, onEnviar }: DialogoInvitarProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    const limpio = email.trim();
    if (limpio === '') {
      setError('Ingresá un email');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(limpio)) {
      setError('Revisá el formato del email');
      return;
    }
    setError(undefined);
    setEnviando(true);
    try {
      await onEnviar(limpio);
      setEnviado(true);
    } catch {
      setError('No pudimos enviar la invitación. Intentá en unos minutos.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog
      abierto
      onCambio={(abierto) => {
        if (!abierto) onCerrar();
      }}
      titulo={enviado ? '¡Listo!' : 'Invitá a un amigo'}
      descripcion={enviado ? undefined : 'Vamos a mandarle un email con tu invitación al programa de referidos.'}
    >
      {enviado ? (
        // Pantalla de éxito: ícono + mensaje breve + cerrar. Sin rastro del
        // formulario ni banner sobre contenido anterior.
        <div className="flex flex-col items-center gap-5 py-4 text-center">
          <span
            aria-hidden="true"
            className="inline-flex size-16 items-center justify-center rounded-pill bg-ok-50 text-ok-700"
          >
            <CheckCircle2 size={36} strokeWidth={1.75} />
          </span>
          <p className="text-base text-ink-700">
            Enviamos tu invitación a <strong className="font-medium text-ink-900">{email}</strong>.
          </p>
          <Button type="button" ancho="full" onClick={onCerrar}>
            Cerrar
          </Button>
        </div>
      ) : (
        <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
          <Field label="Email del invitado" htmlFor="invitar-email" error={error} requerido>
            <Input
              id="invitar-email"
              type="email"
              autoComplete="email"
              placeholder="nombre@ejemplo.com"
              value={email}
              invalido={error !== undefined}
              onChange={(evento) => {
                setEmail(evento.target.value);
                if (error) setError(undefined);
              }}
            />
          </Field>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row-reverse">
            <Button type="submit" ancho="full" tamano="lg" className="sm:w-auto" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar invitación'}
            </Button>
            <Button
              type="button"
              variante="secundario"
              ancho="full"
              tamano="lg"
              className="sm:w-auto"
              onClick={onCerrar}
              disabled={enviando}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
