import { MailCheck } from 'lucide-react';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { clasesBoton } from '@/ui/Button';

export interface RevisaTuMailProps {
  email: string;
  /** Ruta o URL del enlace mágico simulado. */
  hrefEnlace: string;
}

/**
 * Misma pieza visual que la de la landing, pero acá el enlace es del mismo
 * origen, así que se recibe por prop en vez de construirse adentro.
 */
export function RevisaTuMail({ email, hrefEnlace }: RevisaTuMailProps) {
  return (
    <div className="text-center">
      <div className="flex justify-center">
        {/* Plano, como el resto de los tonos del sistema (`Icon`, `Badge`): el
            degradado detrás de un glifo no llega al 3:1 que pide WCAG 1.4.11
            para elementos gráficos. `marca-700` sobre `marca-50` da 6.91:1. */}
        <span className="inline-flex size-20 items-center justify-center rounded-pill bg-marca-50 text-marca-700">
          <MailCheck size={32} strokeWidth={1.5} aria-hidden="true" />
        </span>
      </div>

      <h1 className="mt-6 text-2xl text-ink-950">Revisá tu mail</h1>
      <p className="mt-3 text-base text-ink-600">
        Te enviamos un enlace de acceso a <span className="font-medium text-ink-900">{email}</span>. Abrilo
        desde el celular y entrás sin contraseña.
      </p>

      <Card className="mt-8 text-left">
        <div className="flex items-center gap-3 border-b border-ink-100 pb-3">
          <Icon icono={MailCheck} tono="marca" tamano="sm" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-900">Nexo · Previnca Salud</p>
            <p className="truncate text-xs text-ink-500">Tu enlace de acceso</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-ink-600">Entrá con este enlace para acceder a tu portal.</p>
        <a href={hrefEnlace} className={clasesBoton({ ancho: 'full', className: 'mt-4' })}>
          Abrir el mail (demo)
        </a>
        <p className="mt-3 text-xs text-ink-500">
          Vista previa de demostración. En producción este botón viaja dentro del correo.
        </p>
      </Card>
    </div>
  );
}
