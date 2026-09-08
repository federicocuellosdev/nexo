import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { CircleAlert, Info, SearchX } from 'lucide-react';
import { buscarProducto } from '@/mock/planes';
import { AltaDialog } from '@/features/alta/AltaDialog';
import { Money } from '@/ui/Money';
import { Chip } from '@/ui/Chip';
import { Icon } from '@/ui/Icon';
import { Button, clasesBoton } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';

export function FichaProducto() {
  const { id } = useParams();
  const producto = buscarProducto(id ?? '');
  const [abierto, setAbierto] = useState(false);

  if (!producto) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-16 lg:px-6">
        <EmptyState
          icono={SearchX}
          titulo="No encontramos ese producto"
          descripcion="Puede que el enlace esté viejo o que el producto ya no esté disponible."
        >
          <Link to="/catalogo" className={clasesBoton({ variante: 'secundario' })}>
            Ver el catálogo
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[720px] px-4 pb-28 pt-8 lg:px-6 lg:pb-16 lg:pt-12">
      <Link to="/catalogo" className="text-sm font-medium text-marca-600 hover:text-marca-700">
        ← Volver al catálogo
      </Link>

      <h1 className="mt-4 text-3xl text-ink-950">{producto.nombre}</h1>
      <p className="mt-2 text-base text-ink-600">{producto.detalle}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Money monto={producto.precio} periodo="por mes" tamano="lg" />
        {producto.pendiente ? (
          <Chip tono="warn" icono={CircleAlert}>
            a confirmar
          </Chip>
        ) : null}
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-card bg-marca-50 p-4">
        <Icon icono={Info} tono="marca" tamano="sm" />
        <p className="text-sm text-ink-700">
          Este servicio se contrata aparte de la cuota mensual y{' '}
          <strong className="font-medium">requiere un plan activo</strong>.
        </p>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink-100 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:static lg:mt-10 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <div className="mx-auto max-w-[720px]">
          <Button ancho="full" tamano="lg" onClick={() => setAbierto(true)}>
            {`Contratar ${producto.nombre}`}
          </Button>
        </div>
      </div>

      <AltaDialog
        abierto={abierto}
        onCambio={setAbierto}
        item={{ tipo: 'producto', id: producto.id, nombre: producto.nombre, precio: producto.precio }}
      />
    </div>
  );
}
