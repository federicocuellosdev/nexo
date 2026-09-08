import { Link } from 'react-router';
import { Check } from 'lucide-react';
import type { Plan } from '@/mock/planes';
import { Card } from '@/ui/Card';
import { Badge } from '@/ui/Badge';
import { Chip } from '@/ui/Chip';
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

const MAXIMO_PRESTACIONES = 4;

export function PlanCard({
  plan,
  destacado = false,
  activo = false,
  hrefDetalle,
  onCta,
  etiquetaCta = 'Ver plan',
}: PlanCardProps) {
  const todasIncluidas = plan.prestaciones.filter((p) => p.estado === 'incluido');
  const incluidas = todasIncluidas.slice(0, MAXIMO_PRESTACIONES);
  const recortadas = todasIncluidas.slice(MAXIMO_PRESTACIONES);
  const hayPendienteRecortada = recortadas.some((p) => p.pendiente);

  return (
    <Card as="article" destacada={destacado || activo} className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-xl text-ink-950">{plan.nombre}</h3>
          <p className="mt-1 text-sm text-ink-600">{plan.bajada}</p>
        </div>
        {activo ? <Badge tono="ok">Tu plan</Badge> : destacado ? <Badge tono="marca">Recomendado</Badge> : null}
      </div>

      <Money monto={plan.precio} periodo="por mes" tamano="lg" />

      <ul className="flex flex-col gap-2.5">
        {incluidas.map((prestacion) => (
          <li key={prestacion.label} className="flex items-center gap-2.5 text-sm text-ink-700">
            <Icon icono={Check} tono="ok" tamano="sm" />
            <span className="min-w-0 flex-1">{prestacion.label}</span>
            {prestacion.pendiente ? <Chip tono="warn">a confirmar</Chip> : null}
          </li>
        ))}
      </ul>

      {hayPendienteRecortada ? <Chip tono="warn">datos a confirmar</Chip> : null}

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
