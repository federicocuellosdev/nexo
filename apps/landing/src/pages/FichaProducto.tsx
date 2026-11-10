import { Link, useNavigate, useParams } from 'react-router';
import { Info, SearchX } from 'lucide-react';
import { buscarProducto, PLANES } from '@/mock/planes';
import { formatearPrecio, precioDesde } from '@/lib/formato';
import portadaPoliza from '@/assets/carta-seguros.webp';

/**
 * Portada por producto. Es un `Partial` a propósito: el banco de imágenes de
 * Previnca es de SERVICIOS DE SALUD (odontología, farmacia, urgencias,
 * teleconsulta) y los productos on demand son seguros de salud, sepelio, hogar
 * y vida. La única que calza de verdad es la pareja leyendo una póliza, cuyos
 * íconos muestran familia, auto y casa.
 *
 * Los productos sin foto caen a una banda tipográfica con el color de marca, no
 * a una imagen aproximada: poner un odontólogo en "Árbol de Vida" (sepelio)
 * sería peor que no poner nada. Faltan fotos propias de hogar, vida y sepelio.
 */
const PORTADA: Partial<Record<string, { src: string; alt: string }>> = {
  'salud-1': { src: portadaPoliza, alt: 'Una pareja leyendo juntos su póliza en el living de su casa' },
  vida: { src: portadaPoliza, alt: 'Una pareja leyendo juntos su póliza en el living de su casa' },
};
import { Money } from '@/ui/Money';
import { Icon } from '@/ui/Icon';
import { Button, clasesBoton } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { BarraAccionFija } from '@/ui/BarraAccionFija';
import { Revelar } from '@/ui/Revelar';
import { EncabezadoSeccion } from '@/ui/EncabezadoSeccion';

export function FichaProducto() {
  const { id } = useParams();
  const producto = buscarProducto(id ?? '');
  const navegar = useNavigate();
  const portada = producto ? PORTADA[producto.id] : undefined;

  if (!producto) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-16 lg:px-6">
        <EmptyState
          icono={SearchX}
          como="h1"
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
    <>
      {/* Misma portada a sangre que FichaPlan: son pantallas hermanas y el
          usuario salta de una a otra desde el catálogo. */}
      <section className="relative isolate flex min-h-[46svh] items-end overflow-hidden bg-ink-950 lg:min-h-[52svh]">
        {portada ? (
          <>
            <img
              src={portada.src}
              alt={portada.alt}
              loading="eager"
              fetchPriority="high"
              data-parallax
              className="absolute inset-0 -z-10 size-full object-cover object-[50%_40%]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/60 to-ink-950/10"
            />
          </>
        ) : (
          // Sin foto que corresponda: banda tipográfica con el violeta de marca.
          // Comparte tamaño, tipografía y posición con la versión fotográfica,
          // así que las fichas se leen como una familia y no como dos diseños.
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-marca-700 bg-[radial-gradient(120%_90%_at_15%_10%,var(--color-marca-600)_0%,transparent_60%)]"
          />
        )}
        <div data-entrada className="mx-auto w-full max-w-[1200px] px-4 pt-24 pb-12 lg:px-8 lg:pb-16">
          <Link
            to="/catalogo"
            className="text-xs font-semibold tracking-[0.08em] text-white/80 uppercase hover:text-white"
          >
            ← Volver al catálogo
          </Link>
          <p className="mt-6 font-display text-lg text-marca-100 italic lg:text-xl">(Producto on demand)</p>
          <h1 className="mt-2 max-w-[16ch] font-display text-4xl text-white italic lg:text-5xl">{producto.nombre}</h1>
          <p className="mt-4 max-w-[46ch] text-lg text-white/85">{producto.detalle}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Money monto={producto.precio} periodo="por mes" tamano="lg" tono="claro" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[760px] px-4 pt-16 pb-28 lg:px-8 lg:pt-24 lg:pb-24">
        <Revelar className="flex items-start gap-4 rounded-card bg-marca-50 p-6">
          <Icon icono={Info} tono="marca" tamano="sm" />
          <p className="text-base text-ink-700">
            Este servicio se contrata aparte de la cuota mensual y{' '}
            <strong className="font-medium">requiere un plan activo</strong>.
          </p>
        </Revelar>

        {/* Salida hacia los planes. El aviso de arriba dice "necesitás un plan
            activo" y hasta acá no ofrecía ninguna forma de conseguir uno: el
            usuario quedaba en un callejón sin salida, teniendo que volver solo
            al catálogo. Es un enlace y no un botón porque navega de verdad. */}
        <Revelar className="mt-14">
          <EncabezadoSeccion eyebrow="Antes que nada" titulo="Necesitás un plan activo" tamano="medio" />
          <p className="mt-5 max-w-[52ch] text-base text-ink-600">
            Los productos on demand se suman a un plan mensual. Si todavía no tenés uno, empezá por acá: los planes
            arrancan en {formatearPrecio(precioDesde(PLANES))} por mes.
          </p>
          {/* Secundario, no primario: el CTA principal de esta pantalla es
              "Contratar {producto}". Dos botones violetas apilados compiten
              entre sí y el usuario no sabe cuál es la acción de la página. */}
          <Link to="/catalogo" className={clasesBoton({ variante: 'secundario', tamano: 'lg', className: 'mt-8' })}>
            Ver los planes
          </Link>
        </Revelar>

        <BarraAccionFija>
          <Button
            ancho="full"
            tamano="lg"
            onClick={() => void navegar(`/contratar/producto/${producto.id}`)}
          >
            {`Contratar ${producto.nombre}`}
          </Button>
        </BarraAccionFija>
      </div>
    </>
  );
}
