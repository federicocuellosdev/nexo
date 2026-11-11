import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { MailCheck } from 'lucide-react';
import { obtenerMisRoles, pedirMagicLink } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Field } from '@/ui/Field';
import { Input } from '@/ui/Input';
import { Button, clasesBoton } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { Skeleton } from '@/ui/Skeleton';
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
  const navegar = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [enviando, setEnviando] = useState(false);
  // 'cargando' hasta que terminemos el pre-check de sesión. Mientras tanto
  // no renderizamos el form: evita el flash "tipeá tu email" que se vería a
  // alguien que ya está logueado antes de redirigirlo a /inicio.
  const [chequeando, setChequeando] = useState(true);

  useEffect(() => {
    // Pre-check: si el usuario ya tiene una sesión Supabase válida en
    // localStorage (persistSession + autoRefreshToken se encargan de
    // mantenerla viva hasta 30 días), lo mandamos directo a /inicio y nos
    // ahorramos el magic link. Sin sesión, mostramos el form.
    if (!supabase) {
      setChequeando(false);
      return;
    }
    let cancelado = false;
    void (async () => {
      try {
        const { data } = await supabase!.auth.getSession();
        if (cancelado) return;
        if (data.session) {
          // Hay sesión viva: antes de mandarlo a /inicio chequeamos roles.
          // Si es admin + cliente va al selector; si es solo admin, al
          // dashboard; si es solo cliente, al portal clásico. Sin este
          // chequeo, cualquier admin logueado terminaba en /inicio y no
          // veía nunca /elegir-vista.
          let destino = '/inicio';
          try {
            const roles = await obtenerMisRoles(data.session.access_token);
            const esAdmin = roles.includes('admin');
            const esCliente = roles.includes('cliente');
            if (esAdmin && esCliente) destino = '/elegir-vista';
            else if (esAdmin) destino = '/admin/dashboard';
          } catch (err) {
            console.warn('[ingresar] no se pudieron leer roles', err);
          }
          if (!cancelado) navegar(destino, { replace: true });
          return;
        }
      } catch (err) {
        console.warn('[ingresar] no se pudo leer la sesión de Supabase', err);
      }
      if (!cancelado) setChequeando(false);
    })();
    return () => {
      cancelado = true;
    };
  }, [navegar]);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const encontrado = validarEmail(email);
    if (encontrado !== undefined) {
      setError(encontrado);
      return;
    }
    setError(undefined);
    setEnviando(true);

    const emailLimpio = email.trim();

    // 1. Guardamos el handoff ANTES de llamar al backend: así la landing puede
    //    leerlo apenas carga /revisa-tu-mail (misma clave que usa el alta).
    try {
      sessionStorage.setItem(
        'nexo3.alta',
        JSON.stringify({ intent: 'login', email: emailLimpio }),
      );
    } catch {
      // Storage bloqueado (modo privado): la landing cae a su EmptyState genérico.
    }

    // 2. Disparamos el magic link. Si el backend falla, avisamos y cortamos:
    //    sin esto el usuario esperaba un mail que nunca iba a llegar.
    try {
      await pedirMagicLink(emailLimpio);
    } catch (err) {
      console.error('[ingresar] no se pudo enviar el magic link', err);
      setError('No pudimos enviar el enlace. Probá de nuevo en un momento.');
      setEnviando(false);
      return;
    }

    // 3. `assign` en vez de `href =` para que el test pueda spyarlo.
    window.location.assign(`${landingUrl()}/revisa-tu-mail`);
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
        {chequeando ? (
          // Skeleton mínimo: no mostramos "Ingresá a tu portal" mientras
          // el check de sesión corre, porque si hay sesión válida el
          // usuario nunca debería ver esta pantalla.
          <div className="mx-auto flex max-w-[440px] flex-col gap-4">
            <Skeleton className="h-6 w-2/3 self-center" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        ) : (
          <>
            <div className="flex justify-center">
              <Icon icono={MailCheck} tono="marca" tamano="lg" />
            </div>

            <h1 className="mt-8 font-display text-4xl text-ink-950 italic">Ingresá a tu portal</h1>

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
              <Button type="submit" ancho="full" tamano="lg" disabled={enviando}>
                {enviando ? 'Enviando…' : 'Enviarme el enlace'}
              </Button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
