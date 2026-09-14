import { Link } from 'react-router';
import { Compass } from 'lucide-react';
import { EmptyState } from '@/ui/EmptyState';
import { clasesBoton } from '@/ui/Button';

/**
 * Ruta comodín dentro de `PublicLayout`: cualquier URL desconocida cae acá en
 * vez de en el "Unexpected Application Error!" por defecto de React Router,
 * así conserva el top bar y el pie de la marca.
 */
export function NoEncontrada() {
  return (
    <div className="mx-auto max-w-[560px] px-4 py-16 lg:px-6">
      <EmptyState
        icono={Compass}
        como="h1"
          titulo="Esta página no existe"
        descripcion="Puede que el enlace esté viejo o que la dirección tenga un error de tipeo."
      >
        <Link to="/" className={clasesBoton({ variante: 'secundario' })}>
          Volver al inicio
        </Link>
      </EmptyState>
    </div>
  );
}
