import { useState } from 'react';
import { Link } from 'react-router';
import { MailCheck, MailQuestion } from 'lucide-react';
import { construirUrlCallback, leerHandoff } from '@/lib/handoff';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { clasesBoton } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';

export function RevisaTuMail() {
  // Se lee una sola vez al montar: el handoff no cambia mientras esta pantalla vive.
  const [handoff] = useState(() => leerHandoff());
  const [reenviado, setReenviado] = useState(false);

  if (handoff === null) {
    return (
      <div className="mx-auto max-w-[560px] px-4 py-16 lg:px-6">
        <EmptyState
          icono={MailQuestion}
          titulo="No hay una solicitud en curso"
          descripcion="Elegí un plan o un producto y completá el formulario para recibir tu enlace de acceso."
        >
          <Link to="/catalogo" className={clasesBoton({ variante: 'secundario' })}>
            Ver el catálogo
          </Link>
        </EmptyState>
      </div>
    );
  }

  const email = handoff.intent === 'alta' ? handoff.usuario.email : handoff.email;
  const urlCallback = construirUrlCallback(handoff);

  return (
    <div className="mx-auto max-w-[560px] px-4 py-12 text-center lg:px-6 lg:py-16">
      <div className="flex justify-center">
        <Icon icono={MailCheck} tono="marca" tamano="lg" />
      </div>

      <h1 className="mt-6 text-2xl text-ink-950">Revisá tu mail</h1>
      <p className="mt-3 text-base text-ink-600">
        Te enviamos un enlace de acceso a <span className="font-medium text-ink-900">{email}</span>. Abrilo
        desde el celular y entrás sin contraseña.
      </p>

      {/* Vista previa del mail: en la maqueta no hay servidor de correo, así que
          el "enlace mágico" se muestra acá y navega al portal por URL. */}
      <Card className="mt-8 text-left">
        <div className="flex items-center gap-3 border-b border-ink-100 pb-3">
          <Icon icono={MailCheck} tono="marca" tamano="sm" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-900">Nexo · Previnca Salud</p>
            <p className="truncate text-xs text-ink-500">Tu enlace de acceso</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-ink-600">
          Hola{handoff.intent === 'alta' ? ` ${handoff.usuario.nombre}` : ''}, entrá con este enlace para
          continuar con tu contratación.
        </p>
        <a href={urlCallback} className={clasesBoton({ ancho: 'full', className: 'mt-4' })}>
          Abrir el mail (demo)
        </a>
        <p className="mt-3 text-xs text-ink-500">
          Vista previa de demostración. En producción este botón viaja dentro del correo.
        </p>
      </Card>

      <p className="mt-6 text-sm text-ink-600">
        ¿No te llegó?{' '}
        <button
          type="button"
          onClick={() => setReenviado(true)}
          className="font-medium text-marca-600 underline underline-offset-2 hover:text-marca-700"
        >
          Reenviar
        </button>
      </p>

      {reenviado ? (
        <p
          role="status"
          className="mx-auto mt-4 w-fit rounded-pill bg-ok-50 px-4 py-2 text-sm font-medium text-ok-700"
        >
          Te reenviamos el enlace.
        </p>
      ) : null}
    </div>
  );
}
