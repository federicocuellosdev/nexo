import { Link } from 'react-router';
import { ChevronDown, CreditCard, MousePointerClick, UserPlus } from 'lucide-react';
import { PLANES } from '@/mock/planes';
import { FAQ } from '@/mock/faq';
import { TESTIMONIOS } from '@/mock/testimonios';
import { TestimonioCard } from '@/features/testimonios/TestimonioCard';
import { formatearPrecio, precioDesde } from '@/lib/formato';
import { clasesBoton } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { Revelar } from '@/ui/Revelar';
import { EncabezadoSeccion } from '@/ui/EncabezadoSeccion';
import heroWoman from '@/assets/hero-woman.webp';
import fotoComunidad from '@/assets/banner-comunidad-1.webp';
import fotoTelemedicina from '@/assets/carta-telemedicina.webp';
import fotoCorriendo from '@/assets/banner-comunidad-2.webp';
import fotoGrupoParque from '@/assets/hero-woman-2.webp';
import fotoPareja from '@/assets/hero-woman-3.webp';
import { BannerFotos } from '@/features/galeria/BannerFotos';
import { TiraFotos } from '@/features/galeria/TiraFotos';
import tiraOdontologia from '@/assets/tira-odontologia.webp';
import tiraTeleconsulta from '@/assets/tira-teleconsulta.webp';
import tiraFarmacia from '@/assets/tira-farmacia.webp';
import tiraUrgencias from '@/assets/tira-urgencias.webp';
import tiraMostrador from '@/assets/tira-mostrador.webp';
import tiraVideoconsulta from '@/assets/tira-videoconsulta.webp';

/**
 * Fotos de la tira. Van con `alt` vacío en el componente: son decorativas, la
 * sección ya dice de qué se trata y describir doce imágenes seguidas sería
 * ruido para un lector de pantalla.
 *
 * NO se incluye la foto de mascotas del banco: Nexo cubre salud, sepelio,
 * hogar y vida — no mascotas. Una foto de un perro y un gato en la home
 * insinúa una cobertura que no existe.
 */
/**
 * Fotos de la banda a sangre. El `encuadre` se define foto por foto: la banda
 * es mucho más ancha que alta, así que un `object-position` genérico corta
 * caras en unas y deja aire muerto en otras.
 */
const FOTOS_BANNER = [
  { src: fotoCorriendo, encuadre: '50% 40%' },
  { src: fotoGrupoParque, encuadre: '50% 35%' },
  { src: fotoPareja, encuadre: '50% 30%' },
];

const FOTOS_TIRA = [
  { src: tiraVideoconsulta, alt: '' },
  { src: tiraOdontologia, alt: '' },
  { src: tiraUrgencias, alt: '' },
  { src: tiraFarmacia, alt: '' },
  { src: tiraTeleconsulta, alt: '' },
  { src: tiraMostrador, alt: '' },
];

const PASOS = [
  { icono: MousePointerClick, titulo: 'Elegís', texto: 'Comparás los planes y te quedás con el que te sirve.' },
  { icono: UserPlus, titulo: 'Te registrás', texto: 'Nombre, apellido, email y teléfono. Sin contraseñas.' },
  { icono: CreditCard, titulo: 'Pagás y listo', texto: 'Abonás la primera cuota y tu cobertura queda activa.' },
];

export function Home() {
  const desde = precioDesde(PLANES);

  return (
    <>
      {/* Hero — a viewport completo. `100svh` y no `100vh`: en móvil, `vh`
          incluye la barra del navegador que después se retrae, así que el
          contenido queda cortado justo al cargar. La foto deriva con el scroll
          (motion.css, `[data-parallax]`), gateado por @supports y por
          prefers-reduced-motion. */}
      <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-ink-950 sm:items-end">
        <img
          src={heroWoman}
          alt="Mujer sonriendo mientras mira la app de Nexo en su celular, sentada en el living de su casa"
          loading="eager"
          fetchPriority="high"
          data-parallax
          className="absolute inset-0 -z-10 size-full object-cover object-[75%_22%]"
        />
        {/* Scrim en dos tiempos: uno vertical que sostiene el texto abajo y una
            viñeta que evita que el título se pierda contra las zonas claras.
            Los dos se suman, así que van deliberadamente flojos: al 70% + 55%
            la foto quedaba apagada y gris, y el hero perdía justo la calidez
            que lo hace funcionar. El texto va sobre la mitad inferior, que es
            donde el degradado sí llega a opaco. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/55 to-transparent"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(120%_85%_at_75%_25%,#00000033_45%,rgba(20,18,28,0.4)_100%)]"
        />
        {/* Vignette extra en la esquina superior izquierda: la zona donde
            viven el logo blanco y el botón "Hablar con un vendedor" cae sobre
            una parte muy iluminada de la foto y el texto se pierde. Un radial
            corto, denso al centro y transparente al 65%, oscurece justo ese
            cuadrante sin afectar el resto de la imagen. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_0%_0%,rgba(20,18,28,0.55)_0%,rgba(20,18,28,0.25)_30%,transparent_65%)]"
        />

        <div
          data-entrada
          className="mx-auto w-full max-w-[1200px] px-4 pt-[60px] pb-32 lg:px-8 lg:pt-[140px] lg:pb-24"
        >
          <p className="font-display text-lg text-marca-100 italic lg:text-xl">(Previnca Salud)</p>
          <h1 className="mt-4 max-w-[14ch] text-4xl text-white lg:text-6xl">Tu salud, resuelta desde el celular</h1>
          <p className="mt-6 max-w-[46ch] text-base text-white/80 lg:text-lg">
            {/* Telemedicina (Doc24 · Clínica) es la única prestación en los TRES
                planes (src/mock/planes.ts): emergencias, farmacia, guardia
                odontológica y óptica varían según cuál elijas, así que acá no se
                promete el combo completo para cualquier plan. */}
            Telemedicina en los tres planes, más emergencias, guardia odontológica, farmacia u óptica según el que
            elijas — todo en una cuota mensual que contratás en minutos.
          </p>
          <p className="mt-8 text-lg text-white">
            Planes <strong className="font-semibold">desde {formatearPrecio(desde)} por mes</strong>
          </p>
          {/* CTA del hero: oculto en mobile porque la acción principal vive
              en la barra flotante inferior (PublicLayout). En desktop (sm+)
              aparece acá como único CTA del hero. */}
          <div className="mt-8 hidden sm:block">
            <Link to="/catalogo" className={clasesBoton({ tamano: 'lg' })}>
              Ver planes
            </Link>
          </div>
        </div>
      </section>

      {/* Cómo funciona — el título va arriba a todo lo ancho y abajo la
          composición de fotos junto a los pasos, centrados entre sí.
          Se probó el patrón `sticky` de la referencia y se descartó: con sólo
          3 pasos la columna de texto mide casi lo mismo que la foto, así que
          el sticky no tiene recorrido y queda desalineado. Estirar los pasos
          con padding para fabricarle recorrido sería relleno disfrazado de
          diseño. */}
      <section id="como-funciona" aria-label="Cómo funciona" className="bg-white">
        <div className="mx-auto max-w-[1200px] px-4 py-24 lg:px-8 lg:py-40">
          <Revelar>
            <EncabezadoSeccion eyebrow="Así de fácil" titulo="Cómo funciona" />
          </Revelar>

          <div className="mt-16 grid gap-16 lg:mt-24 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:items-center lg:gap-24">
            <Revelar variante="escala" className="relative">
              <img
                src={fotoComunidad}
                alt="Grupo de amigos sonriendo mientras miran juntos el celular de uno de ellos"
                loading="lazy"
                className="aspect-[4/5] w-full rounded-card object-cover shadow-card"
              />
              <img
                src={fotoTelemedicina}
                alt="Mujer haciendo una videollamada de telemedicina con una doctora desde su notebook"
                loading="lazy"
                className="absolute -right-4 -bottom-8 aspect-[3/4] w-2/5 rounded-card object-cover shadow-elevada ring-4 ring-white lg:-right-12 lg:-bottom-12"
              />
            </Revelar>

            {/* Los pasos dejaron de ser tarjetas: número serif grande + regla
                fina. Una tarjeta con sombra dice "componente de aplicación";
                un número en serif dice "editorial". El `<ol>` y los 3 `<li>`
                se conservan intactos para el árbol de accesibilidad. */}
            <ol data-revelar-grupo className="flex flex-col">
              {PASOS.map((paso, indice) => (
                <Revelar como="li" key={paso.titulo} className="border-t border-ink-100 py-8 first:border-t-0 first:pt-0 lg:py-10 lg:first:pt-0">
                  <div className="flex items-start gap-6 lg:gap-10">
                    <span aria-hidden="true" className="font-display text-4xl leading-none text-marca-300 lg:text-5xl">
                      {indice + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <Icon icono={paso.icono} tono="marca" />
                        <h3 className="font-display text-xl text-ink-950 lg:text-2xl">{paso.titulo}</h3>
                      </div>
                      <p className="mt-3 max-w-[38ch] text-base text-ink-600">{paso.texto}</p>
                    </div>
                  </div>
                </Revelar>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* CTA band a ancho completo. Va PEGADO al final de "Cómo funciona"
          para capturar la intención del visitante que recién entendió el
          flujo. Fondo violeta sólido (marca-600, no gradient — el gradient
          vive sólo en el logo y el primario default) + texto blanco. El
          botón es blanco con texto marca para que destaque sobre el fondo. */}
      <section aria-label="Explorar planes" className="bg-marca-600">
        <div className="mx-auto flex max-w-[720px] flex-col items-center gap-8 px-4 py-16 text-center lg:py-20">
          <div>
            <h2 className="font-display text-3xl text-white lg:text-4xl">¿Listo para empezar?</h2>
            <p className="mx-auto mt-3 max-w-[48ch] text-base text-white/85 lg:text-lg">
              Comparalos uno al lado del otro y quedate con el que te sirve.
            </p>
          </div>
          <Link
            to="/catalogo"
            className="inline-flex items-center justify-center gap-2 rounded-pill bg-white px-7 py-4 text-base font-semibold whitespace-nowrap text-marca-700 shadow-card transition-colors hover:bg-ink-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Ver planes →
          </Link>
        </div>
      </section>

      {/* Corte a sangre. No agrega mensaje ni promesa nueva: es respiración
          entre dos bloques densos, que es lo que sostiene el ritmo de una
          landing editorial larga.
          Alto subido de 32svh a 50/58svh: a 32svh sólo se veía el 43% de la
          foto y las caras quedaban cortadas al medio. */}
      <BannerFotos fotos={FOTOS_BANNER} />

      {/* Tira de fotos. Va DESPUÉS del corte a sangre y antes de los planes:
          es el momento de la página donde ya se explicó cómo funciona y todavía
          no se habla de precios, así que el clima suma en vez de distraer.
          Se eligió tira continua sobre carrusel: un carrusel esconde el
          material detrás de un clic que casi nadie da. */}
      <section aria-label="Nexo en el día a día" className="overflow-hidden bg-white py-20 lg:py-28">
        <Revelar className="mx-auto max-w-[1200px] px-4 lg:px-8">
          <EncabezadoSeccion eyebrow="El día a día" titulo="Salud que se usa, no que se guarda" />
        </Revelar>
        <div className="mt-12">
          <TiraFotos fotos={FOTOS_TIRA} />
        </div>
      </section>

      {/* Planes — sin bg propio: deja ver el app-tone de PublicLayout,
          alternando con el blanco de arriba. Motivo decorativo: círculo pálido
          en marca-100, sin blur (evita el bug conocido de iOS Safari con
          fondos difusos en mobile).
          En la home NO listamos las 3 cards ni los productos on demand: la
          decisión de plan vive en /catalogo. Acá sólo quedó la sección como
          puerta de entrada con un CTA jerarquizado que lleva al catálogo. */}
      <section aria-label="Nuestros planes" className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-32 size-[480px] rounded-full bg-marca-100/70 lg:size-[640px]"
        />
        <div className="relative mx-auto flex max-w-[1200px] flex-col items-center px-4 py-24 text-center lg:px-8 lg:py-40">
          <Revelar>
            <EncabezadoSeccion eyebrow="Elegí el tuyo" titulo="Nuestros planes" />
          </Revelar>
          <Revelar>
            <p className="mx-auto mt-6 max-w-[52ch] text-base text-ink-600">
              Tres planes mensuales con telemedicina, emergencias y beneficios para cuidarte. Comparalos uno al lado del otro y quedate con el que te sirve.
            </p>
          </Revelar>
          <Revelar className="mt-10">
            <Link to="/catalogo" className={clasesBoton({ tamano: 'lg' })}>
              Ver planes de salud →
            </Link>
          </Revelar>
        </div>
      </section>

      {/* Testimonios — antes del FAQ a propósito: quien llegó hasta acá ya vio
          los planes y los productos, y lo que le falta para decidir es prueba
          social, no más detalle de producto. El FAQ resuelve dudas concretas y
          va después.
          Se renderiza sólo si hay testimonios cargados: una sección con el
          título "Lo que dicen nuestros miembros" y nada debajo es peor que no
          tenerla (src/mock/testimonios.ts explica por qué no se rellenan). */}
      {TESTIMONIOS.length > 0 ? (
        <section aria-label="Testimonios">
          <div className="mx-auto max-w-[1200px] px-4 py-24 lg:px-8 lg:py-40">
            <Revelar>
              <EncabezadoSeccion eyebrow="Historias reales" titulo="Lo que dicen nuestros miembros" />
            </Revelar>
            <Revelar>
              <p className="mt-6 max-w-[52ch] text-base text-ink-600">
                Socios que confían en Previnca, en sus propias palabras.
              </p>
            </Revelar>
            <div data-revelar-grupo className="mt-14 grid items-stretch gap-4 md:grid-cols-3">
              {TESTIMONIOS.map((testimonio) => (
                <Revelar key={testimonio.id} className="h-full [&>*]:h-full">
                  <TestimonioCard testimonio={testimonio} />
                </Revelar>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* FAQ — `<details>` nativo: teclado, buscador del navegador y cero JS.
          Sin bg propio: vuelve a alternar con el app-tone. */}
      <section id="faq" aria-label="Preguntas frecuentes">
        <div className="mx-auto max-w-[760px] px-4 py-24 lg:px-8 lg:py-40">
          <Revelar>
            <EncabezadoSeccion eyebrow="Todo lo que preguntan" titulo="Preguntas frecuentes" />
          </Revelar>
          <div data-revelar-grupo className="mt-12 flex flex-col gap-3">
            {FAQ.map((item) => (
              <Revelar key={item.pregunta}>
                <details className="group rounded-card bg-white px-6 py-5 shadow-suave ring-1 ring-ink-100">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-medium text-ink-900 marker:content-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-500">
                    {item.pregunta}
                    <ChevronDown
                      size={18}
                      strokeWidth={1.75}
                      aria-hidden="true"
                      className="shrink-0 text-ink-400 transition-transform duration-200 ease-out-quart group-open:rotate-180 motion-reduce:transition-none"
                    />
                  </summary>
                  <div className="mt-3 flex flex-col gap-2 text-base text-ink-600">
                    {item.respuesta.split('\n').map((parrafo, indice) => (
                      // Los párrafos son posicionales y pueden repetirse entre sí
                      // (dos oraciones idénticas en una misma respuesta): la key
                      // va por índice, no por contenido.
                      <p key={indice}>{parrafo}</p>
                    ))}
                  </div>
                </details>
              </Revelar>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
