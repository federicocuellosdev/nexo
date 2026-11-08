import { useState } from 'react';
import type { FormEvent } from 'react';
import { MailCheck } from 'lucide-react';
import { construirCallbackLogin } from '@/lib/callback';
import { RevisaTuMail } from '@/features/ingreso/RevisaTuMail';
import { Field } from '@/ui/Field';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
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
    // Mismo tratamiento editorial que /revisa-tu-mail de la landing: centrado,
    // ícono grande arriba, título en serif itálica y text-lg en la bajada. Es
    // una pantalla de entrada desde afuera (mail o click directo) y comparte el
    // mismo momento que la del post-envío — que se vean hermanas.
    <div data-entrada className="mx-auto max-w-[600px] px-4 py-20 text-center lg:px-8 lg:py-28">
      {/* El logo va acá y no en un layout porque /ingresar y /auth/callback
          viven FUERA de PortalLayout, sin sidebar ni topbar. Decorativo:
          el <h1> de abajo ya nombra la pantalla. */}
      <div className="mb-10 flex justify-center">
        <LogoNexo alto={26} etiqueta={null} />
      </div>

      {enviado ? (
        <RevisaTuMail email={email.trim()} hrefEnlace={construirCallbackLogin(email)} />
      ) : (
        <>
          <div className="flex justify-center">
            <Icon icono={MailCheck} tono="marca" tamano="lg" />
          </div>

          <h1 className="mt-8 font-display text-4xl text-ink-950 italic">Ingresá a tu portal</h1>
          <p className="mt-5 text-lg text-ink-600">
            Te mandamos un enlace por mail. No hace falta contraseña.
          </p>

          {/* El formulario mantiene su alineación izquierda y ancho acotado
              para que el email entre en una sola línea cómoda. */}
          <form onSubmit={enviar} noValidate className="mx-auto mt-10 flex max-w-[440px] flex-col gap-4 text-left">
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

          <p className="mt-10 text-sm text-ink-600">
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
