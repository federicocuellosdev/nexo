import { useState } from 'react';
import type { FormEvent } from 'react';
import { Dialog } from '@/ui/Dialog';
import { Field } from '@/ui/Field';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';

export interface DialogoInvitarProps {
  onCerrar: () => void;
  onEnviar: (email: string) => void;
}

/**
 * Diálogo mínimo para invitar a un amigo al programa de referidos (hoy en
 * preparación). Un input de email + CTA 'Enviar invitación'. No persiste
 * nada en backend: cuando el programa se habilite, `onEnviar` enganchara
 * al endpoint real.
 */
export function DialogoInvitar({ onCerrar, onEnviar }: DialogoInvitarProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [enviado, setEnviado] = useState(false);

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const limpio = email.trim();
    if (limpio === '') {
      setError('Ingresá un email');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(limpio)) {
      setError('Revisá el formato del email');
      return;
    }
    onEnviar(limpio);
    setEnviado(true);
  }

  return (
    <Dialog
      abierto
      onCambio={(abierto) => {
        if (!abierto) onCerrar();
      }}
      titulo="Invitá a un amigo"
      descripcion="Vamos a mandarle un email con tu invitación al programa de referidos."
    >
      {enviado ? (
        <div className="flex flex-col gap-4">
          <p
            role="status"
            className="rounded-pill bg-ok-50 px-4 py-2 text-center text-sm font-medium text-ok-700"
          >
            Invitación enviada a {email}.
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
            <Button type="submit" ancho="full" tamano="lg" className="sm:w-auto">
              Enviar invitación
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
      )}
    </Dialog>
  );
}
