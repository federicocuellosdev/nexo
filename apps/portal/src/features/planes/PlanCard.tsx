import { Link } from 'react-router';
import { Check, Minus } from 'lucide-react';
import type { Plan, Prestacion } from '@/mock/planes';
import { iconoDePlan } from '@/features/planes/iconoPlan';
import { Card } from '@/ui/Card';
import { CardHero } from '@/ui/CardHero';
import { Badge } from '@/ui/Badge';
import { Icon } from '@/ui/Icon';
import { Money } from '@/ui/Money';
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
 * Las seis prestaciones que las tres cards comparten para que compararlas sea
 * mirar una grilla, no leer tres listas distintas: el mock marca lo que un plan
 * NO cubre con `no-incluido` explícito justo para esto, y Nexo I —el premium—
 * las tiene todas, así que el resto se pinta "ausente" sin confundir.
 */
const CANON: readonly string[] = [
  'Emergencias médicas',
  'Guardia odontológica',
  'Farmacia',
  'Óptica',
  'Doc24 · Clínica',
  'Doc24 · Psicología',
];

export function PlanCard({
  plan,
  destacado = false,
  activo = false,
  hrefDetalle,
  onCta,
  etiquetaCta = 'Ver plan',
}: PlanCardProps) {
  const comparables: Prestacion[] = CANON.map(
    (label): Prestacion => plan.prestaciones.find((p) => p.label === label) ?? { label, estado: 'no-incluido' },
  ).sort((a, b) => Number(a.estado === 'no-incluido') - Number(b.estado === 'no-incluido'));

  return (
    <Card as="article" destacada={destacado || activo} className="flex flex-col gap-4">
      <CardHero icono={iconoDePlan(plan.slug)} />
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 font-display text-xl text-ink-950">{plan.nombre}</h3>
        {activo ? <Badge tono="ok">Tu plan</Badge> : destacado ? <Badge tono="marca">Recomendado</Badge> : null}
      </div>

      <hr className="border-ink-100" />

      <Money monto={plan.precio} periodo="por mes" tamano="lg" />

      <ul className="flex flex-col gap-2.5">
        {comparables.map((prestacion) => {
          const ausente = prestacion.estado === 'no-incluido';
          return (
            <li
              key={prestacion.label}
              className={`flex items-center gap-2.5 text-sm ${ausente ? 'text-ink-400' : 'text-ink-700'}`}
            >
              <Icon
                icono={ausente ? Minus : Check}
                tono={ausente ? 'neutro' : 'ok'}
                tamano="sm"
              />
              <span className="min-w-0 flex-1">{prestacion.label}</span>
            </li>
          );
        })}
      </ul>

      <hr className="border-ink-100" />

      <p className="text-sm text-ink-600">{plan.bajada}</p>

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
