import { Link } from 'react-router';
import type { Producto } from '@/mock/planes';
import { iconoDeProducto } from '@/features/planes/iconoProducto';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { Money } from '@/ui/Money';
import { Button, clasesBoton } from '@/ui/Button';

export interface ProductoCardProps {
  producto: Producto;
  hrefDetalle?: string;
  onCta?: (producto: Producto) => void;
  etiquetaCta?: string;
}

export function ProductoCard({
  producto,
  hrefDetalle,
  onCta,
  etiquetaCta = 'Ver producto',
}: ProductoCardProps) {
  const icono = iconoDeProducto(producto.id);

  return (
    <Card as="article" className="flex h-full flex-col gap-3">
      {/* El ícono va ARRIBA y solo, no al lado del título: a la izquierda del
          texto comprime el nombre —"Seguro de Hogar · hasta 1er piso" ya usa
          dos líneas— y las cinco tarjetas dejan de alinear entre sí.
          `Icon` con tono marca lo pinta plano (marca-50 / marca-700), como el
          resto del sistema. */}
      {icono ? <Icon icono={icono} tono="marca" /> : null}

      <h3 className="text-lg font-medium text-ink-950">{producto.nombre}</h3>
      <p className="text-sm text-ink-600">{producto.detalle}</p>

      <div className="flex flex-wrap items-center gap-2">
        <Money monto={producto.precio} periodo="por mes" />
      </div>

      <div className="mt-auto pt-1">
        {/* Label genérico cuando corresponde: "Ver Seguro de Hogar · hasta
            1er piso" pisaba el ancho de la card en mobile. Mantengo el nombre
            completo en el aria-label por accesibilidad. */}
        {onCta ? (
          <Button
            variante="secundario"
            ancho="full"
            onClick={() => onCta(producto)}
            aria-label={etiquetaCta}
          >
            Ver producto
          </Button>
        ) : hrefDetalle ? (
          <Link
            to={hrefDetalle}
            aria-label={etiquetaCta}
            className={clasesBoton({ variante: 'secundario', ancho: 'full' })}
          >
            Ver producto
          </Link>
        ) : null}
      </div>
    </Card>
  );
}
