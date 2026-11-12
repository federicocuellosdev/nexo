import { Link } from 'react-router';
import { Mail, MapPin, Phone } from 'lucide-react';
import { IconoFacebook, IconoInstagram, IconoLinkedIn } from '@/ui/IconosRedes';
import { LogoNexo, ETIQUETA_MARCA } from '@/ui/LogoNexo';
import { portalUrl } from '@/lib/urls';

/**
 * Datos de contacto REALES de Previnca, igual que los del FAQ: es una decisión
 * explícita del cliente que en la maqueta figuren los verdaderos.
 */
const CONTACTO = [
  { icono: Phone, texto: '+54 9 3415 05-6130', href: 'tel:+5493415056130' },
  { icono: Mail, texto: 'consultas@previncasalud.com.ar', href: 'mailto:consultas@previncasalud.com.ar' },
  { icono: MapPin, texto: 'Rosario, Santa Fe', href: undefined },
] as const;

const REDES = [
  { Icono: IconoInstagram, nombre: 'Instagram', href: 'https://www.instagram.com/previnca_salud/' },
  { Icono: IconoFacebook, nombre: 'Facebook', href: 'https://www.facebook.com/previnca.salud' },
  { Icono: IconoLinkedIn, nombre: 'LinkedIn', href: 'https://www.linkedin.com/company/previnca-salud/' },
] as const;

/**
 * Los enlaces de servicios apuntan a RUTAS, no a anclas.
 *
 * Hoy el catálogo tiene un único plan (Previnca Nexo). La ficha del plan
 * es el destino con la información completa, en vez del bloque de home.
 */
const SERVICIOS = [
  { texto: 'Previnca Nexo', a: '/planes/nexo-1' },
  { texto: 'Productos on demand', a: '/catalogo?tab=productos' },
  { texto: 'Cómo funciona', a: '/#como-funciona' },
] as const;

const enlace =
  'text-sm text-white/70 transition-colors duration-200 ease-out-quart hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

const encabezadoColumna = 'text-xs font-semibold tracking-[0.1em] text-white/70 uppercase';

/**
 * Pie del sitio.
 *
 * Fondo `marca-700` (#5734bd): violeta de marca, sólido y oscuro.
 *
 * El sitio de referencia usa el DEGRADADO `#8660ef → #ee5cd0` con enlaces en
 * blanco al 65%, que da entre 2.71:1 y 2.03:1 — por debajo incluso del piso de
 * 3:1 para texto grande. Pero el problema nunca fue el violeta: eran el paso al
 * rosa y la opacidad baja. `marca-700` sólido da 7.98:1 con blanco pleno y
 * 4.76:1 al 70%, o sea AA hasta en el texto secundario.
 *
 * OJO con las opacidades: sobre este fondo, 70% es el PISO para texto normal
 * (4.76:1). Al 65% ya baja a 4.32:1 y al 50% a 3.18:1. No bajar de `/70` en
 * nada que sea texto de lectura.
 */
export function PieDeSitio() {
  return (
    // Sin margen superior: las secciones de la landing ya cierran con
    // `py-24 lg:py-40`, así que sumarle margen acá duplicaba el aire y dejaba un
    // hueco. El cambio de fondo a oscuro ya separa lo suficiente.
    <footer className="bg-marca-700 text-white">
      <div className="mx-auto max-w-[1200px] px-4 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1.2fr_1fr] lg:gap-8">
          {/* Marca */}
          <div>
            <Link to="/" aria-label={ETIQUETA_MARCA} className="inline-flex items-center">
              <LogoNexo alto={26} etiqueta={null} variante="blanca" />
            </Link>
            <p className="mt-5 max-w-[28ch] text-base text-white/70">Tu salud y tu bienestar, sin vueltas.</p>

            <ul className="mt-7 flex gap-3">
              {REDES.map((red) => (
                <li key={red.nombre}>
                  <a
                    href={red.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={red.nombre}
                    className="inline-flex size-10 items-center justify-center rounded-campo bg-white/10 text-white transition-colors duration-200 ease-out-quart hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <red.Icono />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Servicios */}
          <nav aria-labelledby="pie-servicios">
            <h2 id="pie-servicios" className={encabezadoColumna}>
              Servicios
            </h2>
            <ul className="mt-5 flex flex-col gap-3">
              {SERVICIOS.map((item) => (
                <li key={item.texto}>
                  <Link to={item.a} className={enlace}>
                    {item.texto}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contacto */}
          <div>
            <h2 className={encabezadoColumna}>Contacto</h2>
            <ul className="mt-5 flex flex-col gap-3">
              {CONTACTO.map((dato) => (
                <li key={dato.texto} className="flex items-center gap-3">
                  <dato.icono size={16} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-white/70" />
                  {dato.href ? (
                    <a href={dato.href} className={enlace}>
                      {dato.texto}
                    </a>
                  ) : (
                    // Rosario no es un enlace: no lleva a ningún lado. Un texto
                    // que parece clickeable y no lo es es peor que uno plano.
                    <span className="text-sm text-white/70">{dato.texto}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Información */}
          <nav aria-labelledby="pie-informacion">
            <h2 id="pie-informacion" className={encabezadoColumna}>
              Información
            </h2>
            <ul className="mt-5 flex flex-col gap-3">
              <li>
                <Link to="/#faq" className={enlace}>
                  Preguntas frecuentes
                </Link>
              </li>
              <li>
                <Link to="/terminos" className={enlace}>
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link to="/catalogo" className={enlace}>
                  Catálogo
                </Link>
              </li>
              <li>
                {/* Enlace y no botón: el portal vive en OTRO origen, así que es
                    navegación de verdad y tiene que abrirse en pestaña nueva. */}
                <a href={`${portalUrl()}/ingresar`} className={enlace}>
                  Ingresar al portal
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-8 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-white/70">© 2026 Previnca. Todos los derechos reservados.</p>
          <p className="text-xs text-white/70">Maqueta de demostración. Precios y prestaciones sujetos a confirmación.</p>
        </div>
      </div>
    </footer>
  );
}
