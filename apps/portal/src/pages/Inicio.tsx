import { Link, useLocation } from 'react-router';
import { CreditCard, LayoutGrid, Receipt, ShieldCheck, Sparkles } from 'lucide-react';
import { useSession } from '@/mock/session';
import { cn } from '@/lib/cn';
import { saludo } from '@/lib/identidad';
import { buscarPlan, buscarProducto } from '@/mock/planes';
import { derivarEstado } from '@/lib/estado';
import { portalUrl } from '@/lib/urls';
import { NOVEDADES } from '@/mock/novedades';
import { NovedadesCarousel } from '@/features/novedades/NovedadesCarousel';
import { CoberturaCard } from '@/features/cobertura/CoberturaCard';
import { CredencialConDescarga } from '@/features/credencial/CredencialConDescarga';
import { credencialDeLaSesion } from '@/features/credencial/datos';
import { formatearFecha, planContratado, proximoVencimiento } from '@/features/cobertura/contrataciones';
import { Icon } from '@/ui/Icon';
import { Money } from '@/ui/Money';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { clasesBoton } from '@/ui/Button';

const ACCESOS = [
  { to: '/coberturas', label: 'Ver coberturas', icono: ShieldCheck },
  { to: '/planes', label: 'Contratar producto', icono: LayoutGrid },
  { to: '/movimientos', label: 'Mis movimientos', icono: Receipt },
];

export function Inicio() {
  const sesion = useSession();
  const { state } = useLocation();
  const estado = derivarEstado(sesion);
  const plan = planContratado(sesion);
  const vencimiento = proximoVencimiento(sesion);
  const ultimos = sesion.ordenes.slice(0, 3);
  const credencial = credencialDeLaSesion(sesion);

  // `sesion.intent` guarda lo que el usuario ELIGIÓ (spec §6), no lo que pagó.
  // Sin cruzarlo con el estado, quien elige un plan y no termina el pago cae
  // en el EmptyState genérico "Todavía no tenés un plan" → "Ver planes" y
  // nunca ve un recordatorio de terminar la compra que ya empezó.
  const intent = sesion.intent;
  const elegidoNombre =
    intent === undefined
      ? undefined
      : intent.tipo === 'plan'
        ? buscarPlan(intent.id)?.nombre
        : buscarProducto(intent.id)?.nombre;
  const faltaTerminarCompra = estado === 'conCuentaSinPago' && intent !== undefined;

  // `state` viene de PerfilCompletar tras guardar el perfil, pero por sí solo no
  // alcanza: dice lo que creyó la pantalla anterior, no lo que pasó. Sin cruzarlo
  // contra el estado real, alguien que nunca pagó completaba el perfil y veía
  // "Cobertura activa" con el cartel "Todavía no tenés un plan" justo debajo.
  const avisoDeNavegacion =
    typeof state === 'object' && state !== null && (state as { coberturaActivada?: unknown }).coberturaActivada === true;
  const reciénActivada = avisoDeNavegacion && estado === 'activo';

  return (
    // `data-entrada`: los bloques entran escalonados AL MONTAR, no al scrollear.
    // 420ms con 45ms de stagger (motion.css): lo justo para que la pantalla no
    // aparezca de golpe, sin hacerse notar en una visita diaria.
    <div data-entrada className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl text-ink-950">{saludo(sesion.usuario)}</h1>
        <p className="mt-1 text-sm text-ink-600">Este es el resumen de tu cobertura.</p>
      </div>

      {reciénActivada ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-card bg-ok-50 px-4 py-3 text-sm font-medium text-ok-700"
        >
          <Sparkles size={16} aria-hidden="true" />
          Cobertura activa. Ya podés usar todas tus prestaciones.
        </p>
      ) : null}

      {/* Tu cobertura va PRIMERO. Antes abría "Novedades", que es contenido
          promocional: quien entra al portal viene a ver si está cubierto y
          cuándo vence, no a que le ofrezcan algo. En una superficie de tarea
          el dato del usuario manda y la promoción va después. */}
      <section
        aria-label="Tu cobertura"
        className={cn(
          'flex flex-col gap-4',
          // Tres layouts de columnas, mutuamente excluyentes por estado:
          // 1. Con credencial (activo): 1fr + 420px, tarjeta a la izquierda y
          //    credencial a la derecha. 420px fijos y NO `auto`: con `auto` la
          //    columna se comprimía a 332px y el nº de farmacia quedaba a cero
          //    de holgura contra el QR (medido: 24+168+16+100+24 = 332).
          // 2. Pagado sin perfil: 1fr + 340px, tarjeta de estado a la izquierda
          //    y aviso "Falta un paso" a la derecha. El DOM lee primero la
          //    tarjeta de estado y después la acción.
          // 3. El resto (sin plan, con intent sin pago): columna única capeada
          //    en 720px para que el bloque no quede estirado al ancho del main.
          credencial
            ? 'lg:grid lg:grid-cols-[1fr_420px] lg:items-start'
            : estado === 'pagadoSinPerfil'
              ? 'lg:grid lg:grid-cols-[1fr_340px] lg:items-start'
              : 'lg:max-w-[720px]',
        )}
      >
        {plan && vencimiento ? (
          <CoberturaCard plan={plan} estado={estado} proximoVencimiento={vencimiento} />
        ) : faltaTerminarCompra ? (
          <EmptyState
            icono={CreditCard}
            // h2: la sección "Tu cobertura" no tiene encabezado visible, así
            // que esto cuelga directo del h1 del saludo.
            como="h2"
            titulo="Terminá tu compra"
            descripcion={`Elegiste ${elegidoNombre ?? 'una cobertura'} pero todavía no registramos el pago.`}
          >
            <Link to="/pago" className={clasesBoton({})}>
              Terminar de pagar
            </Link>
          </EmptyState>
        ) : (
          <EmptyState
            icono={ShieldCheck}
            como="h2"
            titulo="Todavía no tenés un plan"
            descripcion="Elegí el plan que mejor te sirva y activá tu cobertura."
          >
            <Link to="/planes" className={clasesBoton({})}>
              Ver planes
            </Link>
          </EmptyState>
        )}

        {estado === 'pagadoSinPerfil' ? (
          // Aviso + CTA extraído del CoberturaCard: ahora es columna hermana.
          // Va DESPUÉS de la tarjeta en el DOM para que caiga en la segunda
          // columna del grid (1fr + 340px) y la lectura siga el orden visual
          // de izquierda a derecha.
          //
          // Sin anillo externo: `warn-200` no existe en los tokens (sólo
          // 50/500/700), así que `ring-warn-200` caía al negro por default y
          // chocaba contra el `warn-50` del fondo. El contraste del fill solo
          // ya marca el bloque; si en el futuro hace falta borde, se agrega
          // `ring-warn-500/15` que se mezcla naturalmente con el fondo.
          <div className="flex flex-col gap-3 rounded-card bg-warn-50 p-5 ring-1 ring-warn-500/40 lg:h-full lg:self-stretch">
            <p className="text-sm font-medium text-warn-700">Falta un paso para activar tu cobertura</p>
            <p className="text-sm text-warn-700">
              Completá tu perfil: cuatro pasos cortos y la cobertura queda operativa.
            </p>
            <Link
              to="/perfil/completar"
              className={clasesBoton({ tamano: 'sm', ancho: 'full', className: 'mt-auto' })}
            >
              Completar perfil
            </Link>
          </div>
        ) : null}

        {/* La credencial va en /inicio y no en /coberturas: es lo que el socio
            MUESTRA, no lo que consulta. El momento de uso real es el mostrador
            de una farmacia o una óptica, y ahí no se navega — se abre el portal
            y tiene que estar. Va debajo de la tarjeta de cobertura porque el
            orden es "¿estoy cubierto?" y recién después "mostralo".
            `credencialDeLaSesion` ya devuelve `undefined` salvo con la
            cobertura activa: la visibilidad por estado vive en ese helper y no
            se decide acá. */}
        {credencial ? (
          <CredencialConDescarga datos={credencial} estado={estado} origen={portalUrl()} />
        ) : null}
      </section>

      {/* Accesos rápidos: son NAVEGACIÓN, no contenido. Por eso pierden la
          sombra y quedan como superficie plana con borde — antes competían en
          peso con la tarjeta de cobertura, que es el dato importante de la
          pantalla. Jerarquía por superficie, no sólo por tamaño de letra. */}
      <section aria-label="Accesos rápidos">
        <h2 className="mb-3 text-lg text-ink-950">Accesos rápidos</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {ACCESOS.map((acceso) => (
            <Link
              key={acceso.to}
              to={acceso.to}
              data-elevar
              className="flex items-center gap-3 rounded-card bg-white p-4 ring-1 ring-ink-100"
            >
              <Icon icono={acceso.icono} tono="marca" tamano="sm" />
              <span className="text-sm font-medium text-ink-900">{acceso.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-label="Últimos movimientos">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-lg text-ink-950">Últimos movimientos</h2>
          <Link to="/movimientos" className="text-sm font-medium text-marca-600 hover:text-marca-700">
            Ver todos
          </Link>
        </div>

        {ultimos.length === 0 ? (
          <EmptyState
            icono={Receipt}
            titulo="Todavía no hay movimientos"
            descripcion="Acá van a aparecer tus pagos y contrataciones."
          />
        ) : (
          <div className="overflow-hidden rounded-card bg-white shadow-card ring-1 ring-ink-100">
            <ul className="divide-y divide-ink-100">
              {ultimos.map((orden) => (
                <li key={orden.id} className="flex items-center gap-3 px-4 py-3">
                  <Icon icono={Receipt} tono="neutro" tamano="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">{orden.concepto}</p>
                    <p className="text-xs text-ink-500">{formatearFecha(orden.fecha)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Chip tono={orden.estado === 'pagada' ? 'ok' : 'warn'}>
                      {orden.estado === 'pagada' ? 'Pagada' : 'Pendiente'}
                    </Chip>
                    <Money monto={orden.monto} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Novedades cierra la pantalla. Es lo único promocional de /inicio y va
          separado del resto por una regla: marca dónde termina "lo tuyo" y
          empieza "lo que te ofrecemos". El encabezado baja a text-base porque
          compite con secciones que sí traen datos del socio. */}
      <section aria-label="Novedades" className="border-t border-ink-100 pt-8">
        <h2 className="mb-3 text-base text-ink-950">Novedades</h2>
        <NovedadesCarousel novedades={NOVEDADES} />
      </section>
    </div>
  );
}
