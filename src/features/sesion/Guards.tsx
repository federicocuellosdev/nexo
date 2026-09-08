import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useSession } from '@/mock/session';
import { derivarEstado } from '@/lib/estado';

/** Sin usuario en la sesión no hay portal: al ingreso. */
export function RequiereUsuario({ children }: { children: ReactNode }) {
  const sesion = useSession();
  if (sesion.usuario === undefined) return <Navigate to="/ingresar" replace />;
  return <>{children}</>;
}

/**
 * `/bienvenida` solo tiene sentido si el usuario venía a contratar algo. Sin
 * intención, el lugar correcto es el inicio del portal (spec §5).
 */
export function RequiereIntent({ children }: { children: ReactNode }) {
  const sesion = useSession();
  if (sesion.usuario === undefined) return <Navigate to="/ingresar" replace />;
  if (sesion.intent === undefined) return <Navigate to="/inicio" replace />;
  return <>{children}</>;
}

/**
 * `/perfil/completar` solo tiene sentido para quien ya pagó. Sin este guard,
 * alguien en `conCuentaSinPago` completaba el formulario y terminaba en
 * `/inicio` viendo "Cobertura activa" sin haber pagado nunca.
 *
 * Bloquea por FALTA DE PAGO, no por estar exactamente en `pagadoSinPerfil`.
 * La diferencia importa: al guardar el perfil la sesión pasa a `activo` en el
 * mismo tick, y un guard atado a `pagadoSinPerfil` se dispararía en ese
 * instante, expulsando al usuario con su propio `Navigate` —sin el `state` del
 * aviso— justo cuando termina el trámite bien.
 */
export function RequierePago({ children }: { children: ReactNode }) {
  const sesion = useSession();
  if (sesion.usuario === undefined) return <Navigate to="/ingresar" replace />;
  const estado = derivarEstado(sesion);
  if (estado === 'sinCuenta' || estado === 'conCuentaSinPago') {
    return <Navigate to="/inicio" replace />;
  }
  return <>{children}</>;
}
