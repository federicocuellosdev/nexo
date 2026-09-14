import { Link } from 'react-router';
import type { Plan } from '@/mock/planes';
import { formatearPrecio } from '@/lib/formato';
import { PlanPrestaciones } from '@/features/planes/PlanPrestaciones';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { Button, clasesBoton } from '@/ui/Button';

export interface PlanCardProps {
  plan: Plan;
  /** Anillo de marca + badge "Recomendado". */
  destacado?: boolean;
  /** Anillo de marca + badge "Tu plan" (lo usa el portal). */
  activo?: boolean;
  /** Si se pasa, el CTA es un <Link> a la ficha. */
  hrefDetalle?: string;
  /** Si se pasa, el CTA es un <button> y gana sobre hrefDetalle. */
  onCta?: (plan: Plan) => void;
  etiquetaCta?: string;
}

/**
 * Tarjeta de plan.
 *
 * Muestra la lista COMPLETA de prestaciones, incluidas las que el plan NO
 * cubre (tachadas) y las que tienen coseguro. Antes filtraba a `incluido` y
 * cortaba en cuatro, así que escondía dos cosas importantes: los coseguros
 * —que son prestaciones que SÍ tenés, con copago— y las exclusiones.
 *
 * Ocultar una exclusión no es neutral: `mock/planes.ts` define `no-incluido`
 * como un estado EXPLÍCITO justamente para que nadie asuma por omisión que
 * un plan trae ambulancia. Una tarjeta que sólo lista lo bueno obliga a entrar
 * a la ficha para descubrir lo que falta.
 *
 * Al mostrarse todo desapareció el chip "datos a confirmar" a nivel tarjeta:
 * existía sólo para avisar que el recorte de cuatro había tapado algo
 * pendiente. Sin recorte, cada prestación lleva su propio chip donde
 * corresponde.
 */
export function PlanCard({
  plan,
  destacado = false,
  activo = false,
  hrefDetalle,
  onCta,
  etiquetaCta = 'Ver plan',
}: PlanCardProps) {
  return (
    <Card as="article" destacada={destacado || activo} className="flex h-full flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-xl text-ink-950">{plan.nombre}</h3>
          <p className="mt-1 text-sm text-ink-600">{plan.bajada}</p>
        </div>
        {activo ? <Badge tono="ok">Tu plan</Badge> : destacado ? <Badge tono="marca">Recomendado</Badge> : null}
      </div>

      {/* Precio grande y en tinta plena, NO en degradado como la referencia:
          el degradado violeta→rosa da 2.97:1 sobre blanco en su extremo, y
          este es el número más importante de la tarjeta. Es el peor lugar
          posible para el peor contraste de la página. */}
      <p className="flex items-baseline gap-1.5">
        <span className="font-display text-4xl text-ink-950">{formatearPrecio(plan.precio)}</span>
        <span className="text-sm text-ink-500">por mes</span>
      </p>

      <PlanPrestaciones prestaciones={plan.prestaciones} compacto />

      <div className="mt-auto pt-1">
        {onCta ? (
          <Button ancho="full" onClick={() => onCta(plan)}>
            {etiquetaCta}
          </Button>
        ) : hrefDetalle ? (
          <Link to={hrefDetalle} className={clasesBoton({ ancho: 'full' })}>
            {etiquetaCta}
          </Link>
        ) : null}
      </div>
    </Card>
  );
}
