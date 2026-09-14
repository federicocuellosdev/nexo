import { useState } from 'react';
import type { FormEvent } from 'react';
import { construirCallbackLogin } from '@/lib/callback';
import { RevisaTuMail } from '@/features/ingreso/RevisaTuMail';
import { Field } from '@/ui/Field';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { landingUrl } from '@/lib/urls';
import { LogoNexo } from '@/ui/LogoNexo';

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
    <div data-entrada className="mx-auto flex min-h-dvh max-w-[440px] flex-col justify-center px-4 py-12">
      {/* El logo va acá y no en un layout porque /ingresar y /auth/callback
          viven FUERA de PortalLayout, sin sidebar ni topbar (también /demo y
          /verificar). Y son justo a las que se llega desde afuera —un mail, un
          QR—, donde lo primero que hay que responder es "¿estoy en el lugar
          correcto?".
          Decorativo (`etiqueta={null}`): el <h1> de abajo ya nombra la pantalla. */}
      <div className="mb-8 flex justify-center">
        <LogoNexo alto={26} etiqueta={null} />
      </div>

      {enviado ? (
        <RevisaTuMail email={email.trim()} hrefEnlace={construirCallbackLogin(email)} />
      ) : (
        <>
          {/* Centrado: el logo y el pie ya lo estaban, y un título alineado a
              la izquierda entre los dos rompía el eje de la pantalla. Los
              campos del formulario siguen alineados a la izquierda, que es
              donde tienen que estar para completarse. */}
          <h1 className="text-center text-2xl text-ink-950">Ingresá a tu portal</h1>
          <p className="mt-2 text-center text-sm text-ink-600">
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
