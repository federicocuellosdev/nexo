import { Link } from 'react-router';
import { CircleAlert } from 'lucide-react';
import type { Producto } from '@/mock/planes';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
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
  return (
    <Card as="article" className="flex flex-col gap-3">
      <h3 className="text-lg font-medium text-ink-950">{producto.nombre}</h3>
      <p className="text-sm text-ink-600">{producto.detalle}</p>

      <div className="flex flex-wrap items-center gap-2">
        <Money monto={producto.precio} periodo="por mes" />
        {producto.pendiente ? (
          <Chip tono="warn" icono={CircleAlert}>
            a confirmar
          </Chip>
        ) : null}
      </div>

      <div className="mt-auto pt-1">
        {onCta ? (
          <Button variante="secundario" ancho="full" onClick={() => onCta(producto)}>
            {etiquetaCta}
          </Button>
        ) : hrefDetalle ? (
          <Link to={hrefDetalle} className={clasesBoton({ variante: 'secundario', ancho: 'full' })}>
            {etiquetaCta}
          </Link>
        ) : null}
      </div>
    </Card>
  );
}
