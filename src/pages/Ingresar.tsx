import { useState } from 'react';
import type { FormEvent } from 'react';
import { construirCallbackLogin } from '@/lib/callback';
import { RevisaTuMail } from '@/features/ingreso/RevisaTuMail';
import { Field } from '@/ui/Field';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { landingUrl } from '@/lib/urls';

/** Misma regla que la validación del alta en la landing: solo errores evidentes. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validarEmail(email: string): string | undefined {
  const valor = email.trim();
  if (valor === '') return 'Ingresá tu email';
  if (!EMAIL.test(valor)) return 'Revisá el email: falta el @ o el dominio';
  return undefined;
}

export function Ingresar() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [enviado, setEnviado] = useState(false);

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const encontrado = validarEmail(email);
    if (encontrado !== undefined) {
      setError(encontrado);
      return;
    }
    setError(undefined);
    setEnviado(true);
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[440px] flex-col justify-center px-4 py-12">
      {enviado ? (
        <RevisaTuMail email={email.trim()} hrefEnlace={construirCallbackLogin(email)} />
      ) : (
        <>
          <h1 className="text-2xl text-ink-950">Ingresá a tu portal</h1>
          <p className="mt-2 text-sm text-ink-600">
            Te mandamos un enlace por mail. No hace falta contraseña.
          </p>

          <form onSubmit={enviar} noValidate className="mt-6 flex flex-col gap-4">
            <Field label="Email" htmlFor="ingresar-email" error={error} requerido>
              <Input
                id="ingresar-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                invalido={error !== undefined}
                onChange={(evento) => setEmail(evento.target.value)}
              />
            </Field>
            <Button type="submit" ancho="full" tamano="lg">
              Enviarme el enlace
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-600">
            ¿Todavía no sos socio?{' '}
            <a
              href={landingUrl()}
              className="font-medium text-marca-600 underline underline-offset-2 hover:text-marca-700"
            >
              Ver catálogo
            </a>
          </p>
        </>
      )}
    </div>
  );
}
