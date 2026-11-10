import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ChevronDown, Download, LayoutGrid, Receipt, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { agregarOrden, getSession, setSession, useSession } from '@/mock/session';
import { DialogoEmailMercadoPago } from '@/features/pago/DialogoEmailMercadoPago';
import { cn } from '@/lib/cn';
import { saludo } from '@/lib/identidad';
import { buscarPlan, buscarProducto } from '@/mock/planes';
import { derivarEstado } from '@/lib/estado';
import { rutaDeshabilitada } from '@/lib/navDisponibilidad';
import { portalUrl } from '@/lib/urls';
import {
  buscarSuscripcionesPorEmail,
  consultarEstadoSuscripcion,
  crearSuscripcion,
  obtenerUltimoLead,
} from '@/lib/api';
import { ETIQUETA, GLIFO, TONO } from '@/features/planes/estadoPrestacion';
import { NOVEDADES } from '@/mock/novedades';
import { NovedadesCarousel } from '@/features/novedades/NovedadesCarousel';
import { MovimientosList } from '@/features/movimientos/MovimientosList';
import { DialogoInvitar } from '@/features/referidos/DialogoInvitar';
import { CoberturaCard } from '@/features/cobertura/CoberturaCard';
import { CredencialCard } from '@/features/credencial/CredencialCard';
import { credencialDeLaSesion } from '@/features/credencial/datos';
import { useCredencialDownload } from '@/features/credencial/useCredencialDownload';
import { planContratado, proximoVencimiento } from '@/features/cobertura/contrataciones';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { Money } from '@/ui/Money';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { clasesBoton } from '@/ui/Button';

/**
 * Accesos rápidos de /inicio. La disponibilidad de cada card la decide el
 * mismo helper que usan Sidebar/BottomNav (`rutaDeshabilitada`), así no hay
 * que recordar poner `disabled` acá cuando cambia la regla.
 *
 * Caso especial: "Otros productos" apunta a /planes (que siempre está
 * habilitado como navegación) pero semánticamente es "contratar un producto
 * on-demand", y los productos son add-on de un plan vigente. Por eso lleva
 * su propia regla local además del check genérico.
 */
const ACCESOS_BASE = [
  { to: '/coberturas', label: 'Ver coberturas', icono: ShieldCheck },
  { to: '/planes', label: 'Otros productos', icono: LayoutGrid, requierePlanVigente: true },
  { to: '/movimientos', label: 'Mis movimientos', icono: Receipt },
] as const;

export function Inicio() {
  const sesion = useSession();
  const { state } = useLocation();
  const estado = derivarEstado(sesion);
  const plan = planContratado(sesion);
  const vencimiento = proximoVencimiento(sesion);
  const ultimos = sesion.ordenes.slice(0, 3);
  const credencial = credencialDeLaSesion(sesion);

  // Botón de descarga vive junto a "Ver mi cobertura" en la columna
  // izquierda (ver más abajo), pero sigue capturando el DOM de la credencial
  // que vive a la derecha — por eso el ref y los flags viven acá, compartidos.
  const credDownload = useCredencialDownload(credencial?.numeroAfiliado ?? '');
  // Diálogo de 'Invitar' que dispara la novedad de referidos.
  const [invitandoAmigo, setInvitandoAmigo] = useState(false);

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

  // Polling de respaldo: si el usuario inició un pago pero cerró /pago antes
  // de que el polling de esa pantalla confirmara, acá seguimos chequeando
  // cada 6s. Apenas MP devuelve `authorized` persistimos la orden (que es lo
  // que mueve a /inicio a mostrar la cobertura) y limpiamos `pagoPendiente`.
  const pagoPendiente = sesion.pagoPendiente;
  useEffect(() => {
    if (!pagoPendiente) return;
    let cancelado = false;
    const intervalo = setInterval(async () => {
      try {
        const status = await consultarEstadoSuscripcion(pagoPendiente.preapprovalId);
        if (cancelado) return;
        if (status === 'authorized') {
          agregarOrden({
            id: `ord-${pagoPendiente.preapprovalId}`,
            fecha: new Date().toISOString().slice(0, 10),
            tipo: pagoPendiente.tipo,
            itemId: pagoPendiente.itemId,
            concepto: `${pagoPendiente.nombre} · cuota mensual`,
            monto: pagoPendiente.monto,
            estado: 'pagada',
          });
          setSession({ pagoPendiente: undefined });
        }
      } catch (err) {
        console.warn('[inicio] polling del pago pendiente falló', err);
      }
    }, 6000);
    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, [pagoPendiente]);

  // Reconciliación al montar: si el usuario ya tiene un intent y un emailPago
  // pero ninguna orden pagada local, preguntamos a MP si hay alguna preapproval
  // `authorized` para ese email. Cubre el caso "pagué antes de que la UI supiera
  // trackearlo" y "el polling se perdió por cerrar la pestaña/limpiar storage".
  // Solo corre una vez por montaje.
  const emailPagoSesion = sesion.emailPago;
  const tienePagada = sesion.ordenes.some((o) => o.estado === 'pagada');
  useEffect(() => {
    if (tienePagada) return;
    if (!emailPagoSesion) return;
    if (!intent) return;
    let cancelado = false;
    void (async () => {
      try {
        const suscripciones = await buscarSuscripcionesPorEmail(emailPagoSesion);
        if (cancelado) return;
        const autorizada = suscripciones.find((s) => s.status === 'authorized');
        if (!autorizada) return;
        // Usamos la info del intent actual para armar la orden: el `monto` de
        // MP no siempre coincide con el que corresponde a la cantidad de
        // familiares actual, y el itemId no se puede recuperar del external
        // reference en el flujo legacy (sin leadId UUID).
        const item =
          intent.tipo === 'plan'
            ? buscarPlan(intent.id)
            : buscarProducto(intent.id);
        if (!item) return;
        const familiaresActual = getSession().familiares ?? 0;
        const titularesActual = intent.tipo === 'plan' ? 1 + familiaresActual : 1;
        const montoLocal = item.precio * titularesActual;
        agregarOrden({
          id: `ord-${autorizada.preapprovalId}`,
          fecha: new Date().toISOString().slice(0, 10),
          tipo: intent.tipo,
          itemId: intent.id,
          concepto: `${item.nombre} · cuota mensual`,
          // Preferimos el monto que MP tiene registrado si está presente;
          // es la fuente de verdad del cobro real.
          monto: autorizada.monto ?? montoLocal,
          estado: 'pagada',
        });
      } catch (err) {
        console.warn('[inicio] no se pudo reconciliar con MP', err);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [emailPagoSesion, intent, tienePagada]);

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
          className="flex items-center gap-2 rounded-card bg-ok-50 px-4 py-3 text-sm font-medium text-ok-700 ring-1 ring-ok-500/30"
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
            ? 'lg:grid lg:grid-cols-[1fr_420px] lg:items-stretch'
            : estado === 'pagadoSinPerfil'
              ? 'lg:grid lg:grid-cols-[1fr_340px] lg:items-start'
              : // Resto de casos (plan pendiente de pago + EmptyState sin plan):
                // full-width. En declientado el banner "Elegí un plan" tiene que
                // ocupar el ancho del main para funcionar como hero del home.
                undefined,
        )}
      >
        {plan && vencimiento ? (
          <CoberturaCard
            plan={plan}
            estado={estado}
            proximoVencimiento={vencimiento}
            accionExtra={
              <>
                {credencial ? (
                  <>
                    <button
                      type="button"
                      onClick={() => void credDownload.descargar()}
                      disabled={credDownload.generando}
                      aria-busy={credDownload.generando}
                      className={clasesBoton({ variante: 'secundario', ancho: 'full' })}
                    >
                      <Download size={16} aria-hidden="true" />
                      {credDownload.generando ? 'Generando…' : 'Descargar credencial'}
                    </button>
                    {credDownload.fallo ? (
                      <p role="alert" className="text-sm text-danger-700">
                        No pudimos generar la imagen. Probá de nuevo, o mostrá la credencial desde esta pantalla.
                      </p>
                    ) : null}
                  </>
                ) : null}
                {/* "Subir de plan" es el CTA de MAYOR jerarquía del bloque:
                    usa el degradado de marca con texto blanco y sombra elevada
                    (mismo tratamiento que los Accesos rápidos activos), para
                    que se lea como la acción que se quiere traccionar por
                    sobre "Ver mi cobertura" y "Descargar credencial". */}
                <Link to="/planes" className={clasesBoton({ variante: 'secundario', ancho: 'full' })}>
                  Subir de plan
                </Link>
              </>
            }
          />
        ) : faltaTerminarCompra && planElegido ? (
          <PlanPendienteCard
            plan={planElegido}
            familiares={sesion.familiares ?? 0}
            onFamiliaresChange={(n) => setSession({ familiares: n })}
          />
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
            <p className="text-sm font-medium text-warn-700">Completá tu perfil para obtener la cobertura</p>
            <p className="text-sm text-warn-700">
              Son cuatro pasos cortos y tu cobertura queda operativa.
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
          <div className="flex h-full w-full max-w-[420px] flex-col">
            <div className="flex-1">
              <CredencialCard
                ref={credDownload.ref}
                datos={credencial}
                estado={estado}
                origen={portalUrl()}
              />
            </div>
          </div>
        ) : null}
      </section>

      {/* Accesos rápidos: superficie plana con borde (no sombra) para que no
          compitan en peso con la tarjeta del plan. Los deshabilitados se
          renderizan como `span` con aria-disabled — mismo tratamiento que los
          items grisados del Sidebar. */}
      <section aria-label="Accesos rápidos" className="border-t border-ink-200 pt-8">
        <h2 className="mb-3 text-lg text-ink-950">Accesos rápidos</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {ACCESOS_BASE.map((acceso) => {
            const requierePlan = 'requierePlanVigente' in acceso && acceso.requierePlanVigente === true;
            const disabled = rutaDeshabilitada(sesion, acceso.to) || (requierePlan && plan === undefined);
            return disabled ? (
              <span
                key={acceso.to}
                role="link"
                aria-disabled="true"
                className="flex cursor-not-allowed items-center gap-3 rounded-card bg-white px-5 py-5 text-ink-300 ring-1 ring-ink-100"
              >
                <Icon icono={acceso.icono} tono="neutro" />
                <span className="text-sm font-medium">{acceso.label}</span>
              </span>
            ) : (
              <Link
                key={acceso.to}
                to={acceso.to}
                data-elevar
                className="flex items-center gap-3 rounded-card bg-brand-oscurecido px-5 py-5 text-white shadow-elevada"
              >
                <acceso.icono size={22} strokeWidth={1.75} aria-hidden="true" className="text-white" />
                <span className="text-sm font-medium">{acceso.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-label="Últimos movimientos" className="border-t border-ink-200 pt-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-lg text-ink-950">Últimos movimientos</h2>
          {rutaDeshabilitada(sesion, '/movimientos') ? null : (
            <Link
              to="/movimientos"
              className="text-sm font-medium text-marca-600 hover:text-marca-700"
            >
              Ver todos
            </Link>
          )}
        </div>

        {/* Mismo tratamiento de tabla que /movimientos (CONCEPTO | FECHA |
            ESTADO | MONTO con encabezados). Reusamos el mismo componente con
            las 3 primeras ordenes para que la vista de /inicio no divirja
            visualmente de la pantalla completa. */}
        <MovimientosList ordenes={ultimos} />
      </section>

      {/* Novedades cierra la pantalla. Es lo único promocional de /inicio y va
          separado del resto por una regla: marca dónde termina "lo tuyo" y
          empieza "lo que te ofrecemos". El encabezado baja a text-base porque
          compite con secciones que sí traen datos del socio. */}
      <section aria-label="Novedades" className="border-t border-ink-200 pt-8">
        <h2 className="mb-3 text-lg text-ink-950">Novedades</h2>
        <NovedadesCarousel novedades={NOVEDADES} onInvitar={() => setInvitandoAmigo(true)} />
      </section>

      {invitandoAmigo ? (
        <DialogoInvitar
          onCerrar={() => setInvitandoAmigo(false)}
          onEnviar={(email) => {
            console.log('[referidos] invitación enviada a', email);
          }}
        />
      ) : null}
    </div>
  );
}

const FAMILIARES_MIN = 0;
const FAMILIARES_MAX = 5;

interface PlanPendienteCardProps {
  plan: NonNullable<ReturnType<typeof buscarPlan>>;
  familiares: number;
  onFamiliaresChange: (n: number) => void;
}

/**
 * Tarjeta única para la situación "elegí un plan y todavía no pagué".
 * Combina resumen + familiares + tabla de coberturas (desplegable) separados
 * por una línea tenue. El precio escala con `familiares` — 1 familiar extra
 * duplica el valor, 2 lo triplica, etc. — porque cada beneficiario paga su
 * cuota completa del plan en Previnca.
 */
function PlanPendienteCard({ plan, familiares, onFamiliaresChange }: PlanPendienteCardProps) {
  const [coberturasAbiertas, setCoberturasAbiertas] = useState(false);
  const [pidiendoEmailMp, setPidiendoEmailMp] = useState(false);
  const navegar = useNavigate();
  const titulares = 1 + familiares;
  const precioTotal = plan.precio * titulares;

  /**
   * Crea la suscripción en MP, abre el checkout en una pestaña nueva y navega
   * a /pago — que, al ver `pagoPendiente` en sesión, se hidrata directo en el
   * estado "Esperando tu pago". Si MP está caído o devuelve 503 (no
   * configurado), cae al mock `/pago` para que el flujo no quede bloqueado.
   */
  async function irAlCheckout(emailMp: string) {
    try {
      const { preapprovalId, initPoint } = await crearSuscripcion({
        planId: plan.slug,
        planNombre: plan.nombre,
        monto: precioTotal,
        emailMp,
        leadId: getSession().leadId,
      });
      // Nueva pestaña: el checkout de MP vive en su dominio y el portal se
      // queda abierto para que la persona vuelva acá al terminar/cancelar
      // sin perder su estado (familiares seleccionados, sesión, etc.).
      // `noopener,noreferrer` por seguridad: la pestaña hija no debe tener
      // acceso al `window.opener` del portal.
      window.open(initPoint, '_blank', 'noopener,noreferrer');
      setSession({
        pagoPendiente: {
          preapprovalId,
          tipo: 'plan',
          itemId: plan.slug,
          nombre: plan.nombre,
          monto: precioTotal,
          emailMp,
          checkoutUrl: initPoint,
        },
      });
      void navegar('/pago');
    } catch (err) {
      console.warn('[inicio] no se pudo crear la suscripcion, cayendo al mock', err);
      void navegar('/pago');
    }
  }

  // Contador sobre el gradient: botón translúcido blanco, texto blanco, hover
  // más opaco. Mantiene el mismo pattern de aro circular que el contador de
  // la landing pero invertido para pisar el fondo saturado.
  const botonContador =
    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30 text-white transition-colors cursor-pointer hover:bg-white/25 hover:ring-white/50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/15 disabled:hover:ring-white/30';

  return (
    // bg-brand en la Card entera: todo el bloque toma el gradient. Texto
    // blanco en todos los elementos — es el momento comercial del portal
    // (igual que el CTA 'Empezá ahora' de la landing). Al desplegar la
    // tabla aparece una zona blanca interna para preservar legibilidad del
    // detalle de prestaciones.
    <Card className="flex flex-col overflow-hidden p-0 !bg-brand-oscurecido !shadow-elevada !ring-marca-300">
      <div className="grid gap-6 p-5 text-white lg:grid-cols-[1fr_320px] lg:items-stretch lg:gap-8 lg:p-6">
        <div className="flex flex-col gap-5">
          <h2 className="font-display text-2xl text-white">{plan.nombre}</h2>
          <p className="text-sm text-white/85">{plan.bajada}</p>

          {/* Divisor y pt-5 translúcidos para no romper el gradient. */}
          <div className="mt-auto flex flex-col gap-3 border-t border-white/20 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-white/80" aria-hidden="true" />
              <p className="text-sm text-white">¿Agregás familiares al plan?</p>
            </div>
            <div
              className="flex items-center gap-4 self-start sm:self-auto"
              role="group"
              aria-label="Cantidad de familiares adicionales"
            >
              <button
                type="button"
                aria-label="Quitar un familiar"
                disabled={familiares <= FAMILIARES_MIN}
                onClick={() => onFamiliaresChange(Math.max(FAMILIARES_MIN, familiares - 1))}
                className={botonContador}
              >
                −
              </button>
              <span
                aria-live="polite"
                className="min-w-[2ch] text-center text-xl font-medium tabular-nums text-white"
              >
                {familiares}
              </span>
              <button
                type="button"
                aria-label="Agregar un familiar"
                disabled={familiares >= FAMILIARES_MAX}
                onClick={() => onFamiliaresChange(Math.min(FAMILIARES_MAX, familiares + 1))}
                className={botonContador}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:border-l lg:border-white/20 lg:pl-8">
          <div>
            <Money monto={precioTotal} periodo="por mes" tamano="lg" tono="claro" />
            <p className="mt-1 text-xs text-white/75">
              {titulares === 1 ? '1 persona' : `${titulares} personas`} · ${plan.precio.toLocaleString('es-AR')} c/u
            </p>
          </div>
          <p className="text-sm text-white/85">
            Contratá un plan de salud y obtené cobertura para vos y tu familia.
          </p>
          {/* CTA invertido: fondo blanco sobre gradient. El text-marca-700
              asegura 7.98:1 de contraste contra el blanco (AAA). */}
          <button
            type="button"
            onClick={() => {
              // Si ya hay emailPago en sesión, saltamos el popup y creamos la
              // suscripción directo. Si no, lo pedimos primero.
              const emailMp = getSession().emailPago;
              if (emailMp) {
                void irAlCheckout(emailMp);
              } else {
                setPidiendoEmailMp(true);
              }
            }}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-pill bg-white px-5 text-base font-medium text-marca-700 shadow-suave transition-colors duration-200 ease-out-expo hover:bg-ink-50 motion-safe:active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:mt-auto"
          >
            Terminar de pagar
          </button>
        </div>
      </div>

      {/* Toggle sobre el gradient (hereda bg-brand de la Card), texto blanco
          + hover translúcido. La tabla cuando se expande SÍ tiene bg-white
          interno, para que el detalle de prestaciones se lea bien. */}
      <div>
        <button
          type="button"
          aria-expanded={coberturasAbiertas}
          aria-controls="tabla-cobertura"
          onClick={() => setCoberturasAbiertas((v) => !v)}
          className="flex w-full cursor-pointer items-center justify-between gap-3 border-t border-white/20 px-5 py-4 text-left transition-colors hover:bg-white/10 lg:px-6"
        >
          <p className="text-sm font-medium text-white">Ver coberturas del plan</p>
          <ChevronDown
            size={20}
            aria-hidden="true"
            className={cn(
              'shrink-0 text-white/80 transition-transform duration-200',
              coberturasAbiertas && 'rotate-180',
            )}
          />
        </button>

        {/* Collapsible animado con el truco de grid-rows 0fr → 1fr: el
            contenedor exterior anima su altura (sin saber dimensiones del
            hijo) y el hijo está siempre renderizado dentro de `overflow-hidden`.
            Cuando colapsa, el hijo queda inaccesible al tab porque forzamos
            visibility-hidden en el estado cerrado. */}
        <div
          id="tabla-cobertura"
          className={cn(
            'grid overflow-hidden transition-[grid-template-rows,visibility] duration-300 ease-out',
            coberturasAbiertas ? 'grid-rows-[1fr] visible' : 'grid-rows-[0fr] invisible',
          )}
          aria-hidden={!coberturasAbiertas}
        >
          {/* Zona blanca interna: rounded-card en las 4 esquinas. El
              rounded-card del Card padre sólo recorta hijos que se desborden
              — como esta zona termina DENTRO de la Card (hay un pequeño
              residuo de gradient al final), las esquinas inferiores necesitan
              redondearse explícitamente. */}
          <div className="min-h-0 overflow-hidden rounded-card bg-white">
            {/* Desktop: tabla real (datos tabulares, mejor semántica para
                screen readers y copy/paste). Mobile: cards apiladas. */}
            <table className="hidden w-full border-collapse text-left sm:table">
              <thead>
                <tr className="border-b border-ink-100 text-xs font-medium text-ink-500">
                  <th scope="col" className="px-5 pb-3 pt-4 font-medium lg:px-6">Prestación</th>
                  <th scope="col" className="px-5 pb-3 pt-4 font-medium lg:px-6">Estado</th>
                  <th scope="col" className="px-5 pb-3 pt-4 font-medium lg:px-6">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {plan.prestaciones.map((prestacion) => (
                  <tr
                    key={prestacion.label}
                    className="align-middle transition-colors hover:bg-ink-50/50"
                  >
                    <td className="px-5 py-4 lg:px-6">
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
                    </td>
                    <td className="px-5 py-4 lg:px-6">
                      <Chip tono={TONO[prestacion.estado]} icono={GLIFO[prestacion.estado]}>
                        {ETIQUETA[prestacion.estado]}
                      </Chip>
                    </td>
                    <td className="px-5 py-4 text-sm text-ink-600 lg:px-6">
                      {prestacion.detalle ?? <span className="text-ink-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-ink-100 sm:hidden">
              {plan.prestaciones.map((prestacion) => (
                <li key={prestacion.label} className="flex flex-col gap-2 px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
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
                    <Chip tono={TONO[prestacion.estado]} icono={GLIFO[prestacion.estado]}>
                      {ETIQUETA[prestacion.estado]}
                    </Chip>
                  </div>
                  {prestacion.detalle ? (
                    <p className="text-sm text-ink-600">{prestacion.detalle}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {pidiendoEmailMp ? (
        <DialogoEmailMercadoPago
          // Siempre vacío: no asumimos que el email de contacto es el mismo
          // que el de MercadoPago (es justamente lo que el popup pide).
          valorInicial=""
          onCerrar={() => setPidiendoEmailMp(false)}
          onConfirmar={(email) => {
            setSession({ emailPago: email });
            setPidiendoEmailMp(false);
            void irAlCheckout(email);
          }}
        />
      ) : null}
    </Card>
  );
}
