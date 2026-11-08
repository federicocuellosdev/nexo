import { useState } from 'react';
import type { FormEvent } from 'react';
import { MailCheck } from 'lucide-react';
import { construirCallbackLogin } from '@/lib/callback';
import { RevisaTuMail } from '@/features/ingreso/RevisaTuMail';
import { Field } from '@/ui/Field';
import { Input } from '@/ui/Input';
import { Button, clasesBoton } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { landingUrl } from '@/lib/urls';
import { LogoNexo, ETIQUETA_MARCA } from '@/ui/LogoNexo';

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
    // /ingresar vive FUERA de PortalLayout (no tiene sidebar). Armamos un
    // header propio con logo + "Ver catálogo": el acceso a la landing es lo
    // único que tiene sentido ofrecer desde acá (no mostramos "Ingresar" ni
    // "Crear cuenta" porque esta ES la pantalla de ingresar).
    <div data-entrada className="flex min-h-dvh flex-col bg-app">
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-3 px-4 lg:h-16 lg:px-8">
          {/* Link al landing: el portal vive en OTRO origen en dev (y en el
              mismo dominio pero otra ruta en prod), así que es un <a> real
              para que "abrir en pestaña nueva" funcione. */}
          <a href={landingUrl()} aria-label={ETIQUETA_MARCA} className="inline-flex items-center">
            <LogoNexo alto={22} etiqueta={null} />
          </a>
          <a href={`${landingUrl()}/catalogo`} className={clasesBoton({ variante: 'secundario', tamano: 'sm' })}>
            Ver catálogo
          </a>
        </div>
      </header>

      {/* Mismo tratamiento editorial que /revisa-tu-mail de la landing:
          centrado, ícono grande arriba, título en serif itálica y text-lg en
          la bajada. Es una pantalla de entrada desde afuera y comparte el
          mismo momento que la del post-envío — que se vean hermanas. */}
      <main className="mx-auto w-full max-w-[600px] px-4 py-20 text-center lg:px-8 lg:py-28">
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
          </>
        )}
      </main>
    </div>
  );
}
