import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { CircleAlert, LayoutGrid, Receipt, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { getSession, setSession, useSession } from '@/mock/session';
import { cn } from '@/lib/cn';
import { saludo } from '@/lib/identidad';
import { buscarPlan, buscarProducto } from '@/mock/planes';
import { derivarEstado } from '@/lib/estado';
import { portalUrl } from '@/lib/urls';
import { obtenerUltimoLead } from '@/lib/api';
import { ETIQUETA, GLIFO, TONO } from '@/features/planes/estadoPrestacion';
import { NOVEDADES } from '@/mock/novedades';
import { NovedadesCarousel } from '@/features/novedades/NovedadesCarousel';
import { CoberturaCard } from '@/features/cobertura/CoberturaCard';
import { CredencialConDescarga } from '@/features/credencial/CredencialConDescarga';
import { credencialDeLaSesion } from '@/features/credencial/datos';
import { formatearFecha, planContratado, proximoVencimiento } from '@/features/cobertura/contrataciones';
import { Card } from '@/ui/Card';
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
  const planElegido = intent?.tipo === 'plan' ? buscarPlan(intent.id) : undefined;
  const productoElegido = intent?.tipo === 'producto' ? buscarProducto(intent.id) : undefined;
  const faltaTerminarCompra = estado === 'conCuentaSinPago' && intent !== undefined;

  // Fallback cuando la sesión no tiene `intent`: consultamos el backend por
  // el último lead del email. Pasa con usuarios que entraron por login antes
  // del fix de planId en el magic link, o cuya sesión persistida no quedó
  // ligada a un plan. Sin esto, la pantalla se queda en el EmptyState
  // genérico incluso cuando en v3.leads hay un plan esperando pago.
  const emailSesion = sesion.usuario?.email;
  useEffect(() => {
    if (intent !== undefined) return;
    if (!emailSesion) return;
    let cancelado = false;
    void (async () => {
      try {
        const lead = await obtenerUltimoLead(emailSesion);
        if (cancelado || lead === null) return;
        // Hidratamos nombre/apellido si la sesión los tenía vacíos (caso
        // típico post-login): así la sidebar muestra "Federico Cuellos" en
        // vez del email crudo.
        const titular = lead.titular;
        const usuarioActual = getSession().usuario;
        const faltaNombre =
          usuarioActual !== undefined &&
          (usuarioActual.nombre?.trim() ?? '') === '' &&
          (usuarioActual.apellido?.trim() ?? '') === '';
        const patch: Parameters<typeof setSession>[0] = {
          intent: { tipo: lead.tipo, id: lead.id },
        };
        if (titular && usuarioActual && faltaNombre) {
          patch.usuario = {
            ...usuarioActual,
            nombre: titular.nombre,
            apellido: titular.apellido,
          };
        }
        setSession(patch);
      } catch (err) {
        console.warn('[inicio] no se pudo recuperar el lead del email', err);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [intent, emailSesion]);

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
              : // Cuando hay plan pendiente de pago renderizamos resumen full-width
                // + tabla de cobertura debajo: el bloque ocupa todo el contenedor
                // para que la tabla respire. En el resto de casos (EmptyState)
                // mantenemos la medida angosta para que el aviso no quede flotando.
                faltaTerminarCompra && (planElegido || productoElegido)
                ? undefined
                : 'lg:max-w-[720px]',
        )}
      >
        {plan && vencimiento ? (
          <CoberturaCard plan={plan} estado={estado} proximoVencimiento={vencimiento} />
        ) : faltaTerminarCompra && planElegido ? (
          // El usuario eligió un plan y verificó el email, pero todavía no pagó.
          // Dos bloques apilados: (1) Card resumen con los datos clave y CTA,
          // (2) Card con la tabla de coberturas. Fragment para que ambas caigan
          // como hijas directas del section y hereden su flex-col/gap.
          <>
            {/* Desktop: dos columnas — izquierda plan + familiares,
                derecha precio + copy + CTA. Mobile: apilado. */}
            <Card className="grid gap-6 p-5 ring-marca-100 lg:grid-cols-[1fr_320px] lg:items-stretch lg:gap-8 lg:p-6">
              {/* Columna izquierda */}
              <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-ink-500">Tu plan elegido</p>
                    <h2 className="font-display text-2xl text-ink-950">{planElegido.nombre}</h2>
                    <p className="mt-1 text-sm text-ink-600">{planElegido.bajada}</p>
                  </div>
                  <Chip tono="warn">Pago pendiente</Chip>
                </div>

                {/* Familiares: fila con la pregunta a la izquierda y un
                    contador − N + a la derecha. `sesion.familiares` mapea a
                    beneficiaries.length del /sales de SF (sin incluir al
                    titular); el precio por familiar se resuelve en /pago
                    contra el pricing final de Previnca. */}
                <div className="flex flex-col gap-4 rounded-card bg-ink-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-marca-600" aria-hidden="true" />
                      <p className="text-sm font-medium text-ink-900">¿Agregás familiares al plan?</p>
                    </div>
                    <p className="mt-1 text-xs text-ink-600">
                      Cónyuge, hijos u otros convivientes con la misma cobertura.
                    </p>
                  </div>
                  {(() => {
                    const familiares = sesion.familiares ?? 0;
                    const MIN = 0;
                    const MAX = 5;
                    const botonBase =
                      'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-ink-200 text-ink-700 transition-colors cursor-pointer hover:bg-ink-50 hover:ring-ink-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:ring-ink-200';
                    return (
                      <div
                        className="flex items-center gap-4 self-start sm:self-auto"
                        role="group"
                        aria-label="Cantidad de familiares adicionales"
                      >
                        <button
                          type="button"
                          aria-label="Quitar un familiar"
                          disabled={familiares <= MIN}
                          onClick={() => setSession({ familiares: Math.max(MIN, familiares - 1) })}
                          className={botonBase}
                        >
                          −
                        </button>
                        <span
                          aria-live="polite"
                          className="min-w-[2ch] text-center text-xl font-medium tabular-nums text-ink-950"
                        >
                          {familiares}
                        </span>
                        <button
                          type="button"
                          aria-label="Agregar un familiar"
                          disabled={familiares >= MAX}
                          onClick={() => setSession({ familiares: Math.min(MAX, familiares + 1) })}
                          className={botonBase}
                        >
                          +
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Columna derecha */}
              <div className="flex flex-col gap-4 lg:border-l lg:border-ink-100 lg:pl-8">
                <Money monto={planElegido.precio} periodo="por mes" tamano="lg" />
                <p className="text-sm text-ink-600">
                  Contratá un plan de salud y obtené cobertura para vos y tu familia.
                </p>
                <Link to="/pago" className={clasesBoton({ ancho: 'full', className: 'lg:mt-auto' })}>
                  Terminar de pagar
                </Link>
              </div>
            </Card>

            {/* Tabla de cobertura: tres columnas (prestación / estado /
                detalle). Prefiero tabla real y no un grid de divs porque es
                datos tabulares genuinos — la semántica ayuda a screen readers
                y al copy/paste. En mobile cae a cards verticales para que no
                se desborde el ancho. */}
            <Card className="p-0 overflow-hidden">
              <div className="border-b border-ink-100 px-5 py-4 lg:px-6">
                <h3 className="text-base font-medium text-ink-950">Tabla de cobertura</h3>
                <p className="mt-0.5 text-sm text-ink-600">
                  Prestaciones incluidas, con coseguro y no cubiertas por este plan.
                </p>
              </div>

              {/* Desktop: tabla. Mobile (hasta sm): ver más abajo. */}
              <table className="hidden w-full border-collapse sm:table">
                <thead>
                  <tr className="border-b border-ink-100 bg-ink-50/50 text-left text-xs font-medium uppercase tracking-wide text-ink-500">
                    <th scope="col" className="px-5 py-3 lg:px-6">Prestación</th>
                    <th scope="col" className="px-5 py-3 lg:px-6">Estado</th>
                    <th scope="col" className="px-5 py-3 lg:px-6">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {planElegido.prestaciones.map((prestacion) => (
                    <tr key={prestacion.label} className="align-top">
                      <td className="px-5 py-3 lg:px-6">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              'text-sm',
                              prestacion.estado === 'no-incluido'
                                ? 'text-ink-400 line-through'
                                : 'text-ink-900',
                            )}
                          >
                            {prestacion.label}
                          </span>
                          {prestacion.pendiente ? (
                            <Chip tono="warn" icono={CircleAlert}>
                              a confirmar
                            </Chip>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-3 lg:px-6">
                        <Chip tono={TONO[prestacion.estado]} icono={GLIFO[prestacion.estado]}>
                          {ETIQUETA[prestacion.estado]}
                        </Chip>
                      </td>
                      <td className="px-5 py-3 text-sm text-ink-600 lg:px-6">
                        {prestacion.detalle ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile: cards apiladas con los mismos datos. Una tabla real en
                  320-640px rompe por el ancho mínimo del contenido. */}
              <ul className="divide-y divide-ink-100 sm:hidden">
                {planElegido.prestaciones.map((prestacion) => (
                  <li key={prestacion.label} className="flex flex-col gap-2 px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          prestacion.estado === 'no-incluido'
                            ? 'text-ink-400 line-through'
                            : 'text-ink-900',
                        )}
                      >
                        {prestacion.label}
                      </span>
                      {prestacion.pendiente ? (
                        <Chip tono="warn" icono={CircleAlert}>
                          a confirmar
                        </Chip>
                      ) : null}
                    </div>
                    <Chip tono={TONO[prestacion.estado]} icono={GLIFO[prestacion.estado]}>
                      {ETIQUETA[prestacion.estado]}
                    </Chip>
                    {prestacion.detalle ? (
                      <p className="text-sm text-ink-600">{prestacion.detalle}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>
          </>
        ) : faltaTerminarCompra && productoElegido ? (
          // Mismo caso pero para un producto on demand (no un plan mensual).
          // Sin lista de prestaciones: los productos son una línea sola.
          <Card className="flex flex-col gap-5 p-5 ring-marca-100 lg:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-ink-500">Tu producto elegido</p>
                <h2 className="font-display text-2xl text-ink-950">{productoElegido.nombre}</h2>
                <p className="mt-1 text-sm text-ink-600">{productoElegido.detalle}</p>
              </div>
              <Chip tono="warn">Pago pendiente</Chip>
            </div>

            <div className="border-t border-ink-100 pt-4">
              <Money monto={productoElegido.precio} />
            </div>

            <Link to="/pago" className={clasesBoton({ ancho: 'full' })}>
              Terminar de pagar
            </Link>
          </Card>
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
