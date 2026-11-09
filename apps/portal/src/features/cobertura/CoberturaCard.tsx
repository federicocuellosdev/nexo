import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ShieldCheck } from 'lucide-react';
import type { Plan } from '@/mock/planes';
import type { EstadoCuenta } from '@/lib/estado';
import { CoberturaEstado } from '@/features/cobertura/CoberturaEstado';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { Money } from '@/ui/Money';
import { clasesBoton } from '@/ui/Button';

export interface CoberturaCardProps {
  plan: Plan;
  estado: EstadoCuenta;
  /** Fecha ficticia ya formateada para mostrar. */
  proximoVencimiento: string;
  /** Acción adicional a renderizar inmediatamente debajo de "Ver mi cobertura".
   *  /inicio lo usa para colgar "Descargar credencial" dentro de la misma
   *  tarjeta, así las dos acciones se leen como una pila continua. */
  accionExtra?: ReactNode;
}

/**
 * Patrón MercadoPago: título + dato grande + acción secundaria.
 *
 * Es el bloque MÁS importante de /inicio y /coberturas: responde "¿estoy
 * cubierto y hasta cuándo?", que es a lo que se entra al portal. Por eso pesa
 * más que el resto — anillo de marca suave en vez del neutro, más aire interno
 * y el nombre del plan un paso más grande. Antes tenía exactamente el mismo
 * tratamiento que un acceso rápido, que es sólo navegación.
 *
 * NO usa `Card destacada`: ese anillo (`ring-2 ring-marca-500`) significa "esta
 * es la elegida ENTRE VARIAS" —el plan recomendado, el plan activo dentro de
 * una grilla— y acá la tarjeta está sola, no compitiendo con hermanas. El
 * `ring-marca-100` dice "esto importa", que es otra cosa.
 */
export function CoberturaCard({ plan, estado, proximoVencimiento, accionExtra }: CoberturaCardProps) {
  return (
    <Card className="flex flex-col gap-5 p-5 ring-marca-100 lg:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Icon icono={ShieldCheck} tono="marca" />
          <div className="min-w-0">
            <p className="text-sm text-ink-500">Tu cobertura</p>
            {/* h2 y no h3: su único consumidor (Inicio.tsx) la monta dentro de
                `<section aria-label="Tu cobertura">`, que no tiene encabezado
                visible, así que este cuelga directo del h1 del saludo. Con h3
                el documento saltaba un nivel (WCAG 1.3.1). Lo verifica
                `src/pages/jerarquiaEncabezados.test.tsx`. */}
            <h2 className="font-display text-2xl text-ink-950">{plan.nombre}</h2>
          </div>
        </div>
        <CoberturaEstado estado={estado} />
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-ink-100 pt-4">
        <Money monto={plan.precio} periodo="por mes" tamano="lg" />
        <span className="text-sm text-ink-500">{`Vence el ${proximoVencimiento}`}</span>
      </div>

      {estado === 'pagadoSinPerfil' ? (
        // El aviso "Falta un paso: completá tu perfil" ya no vive adentro de la
        // tarjeta: lo monta /inicio como columna hermana a la izquierda. Dejar
        // la tarjeta sin acción propia es intencional — el estado se lee en el
        // chip "Pendiente de activación" del encabezado y la acción es
        // responsabilidad del aviso externo.
        null
      ) : estado === 'conCuentaSinPago' ? (
        // NO ES CÓDIGO MUERTO, aunque hoy no se alcance: su único consumidor
        // —Inicio.tsx; Coberturas.tsx dejó de usarla y arma su propia tarjeta—
        // solo la monta cuando `planContratado(sesion)` devuelve un plan, y ese
        // helper exige una orden PAGADA — mutuamente excluyente con
        // conCuentaSinPago.
        // Ese hueco (elegir un plan y no pagarlo, sin ver ningún recordatorio)
        // se cerró en Inicio.tsx leyendo `sesion.intent` directamente, sin
        // pasar por acá. Esta rama queda para el día en que `plan` deje de
        // exigir pago (ej. mostrar el plan intentado ANTES de pagar) — no
        // borrar por "inalcanzable" sin resolver antes ese rediseño, y no
        // asumir que hoy está viva.
        <div className="flex flex-col items-stretch gap-3 rounded-campo bg-danger-50 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-danger-700">
            Todavía no registramos tu pago. La cobertura arranca cuando lo hagas.
          </p>
          <Link
            to="/pago"
            className={clasesBoton({ tamano: 'sm', ancho: 'full', className: 'sm:w-auto sm:shrink-0' })}
          >
            Pagar mi plan
          </Link>
        </div>
      ) : (
        // 'Ver mi cobertura' es el CTA protagonico de la tarjeta: brand
        // gradient + sombra elevada, mismo tratamiento que los Accesos
        // rapidos. Las acciones secundarias (Subir de plan / Descargar
        // credencial) van en outline negro en `accionExtra`.
        <Link
          to="/coberturas"
          data-elevar
          className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-pill bg-brand-oscurecido px-5 text-base font-medium text-white shadow-elevada transition-colors"
        >
          Ver mi cobertura
        </Link>
      )}

      {accionExtra}
    </Card>
  );
}
