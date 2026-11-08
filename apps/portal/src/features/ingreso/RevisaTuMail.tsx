import { MailCheck } from 'lucide-react';
import { Icon } from '@/ui/Icon';

export interface RevisaTuMailProps {
  email: string;
  /**
   * Compat: el padre (Ingresar.tsx) sigue calculando y pasando el enlace
   * demo, pero esta pieza ya no lo renderiza. En v3 el email de login va a
   * mandarse desde el backend, igual que el de alta, y la vista previa demo
   * deja de tener sentido. Se mantiene en la prop para no romper el caller
   * hasta que ese flow de login se cablee contra el API.
   */
  hrefEnlace?: string;
}

/**
 * Mismo tratamiento editorial que /revisa-tu-mail de la landing: ícono grande,
 * título en serif itálica, bajada en text-lg y foco en una sola acción (revisar
 * el inbox). Vive dentro del wrapper centrado de /ingresar — por eso no agrega
 * contenedor propio.
 */
export function RevisaTuMail({ email }: RevisaTuMailProps) {
  return (
    <>
      <div className="flex justify-center">
        <Icon icono={MailCheck} tono="marca" tamano="lg" />
      </div>

      <h1 className="mt-8 font-display text-4xl text-ink-950 italic">Revisá tu mail</h1>
      <p className="mt-5 text-lg text-ink-600">
        Te enviamos un enlace de acceso a <span className="font-medium text-ink-900">{email}</span>. Si no lo
        encontrás, revisá la carpeta de spam.
      </p>
    </>
  );
}
