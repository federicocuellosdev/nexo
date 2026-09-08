import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useSession } from '@/mock/session';

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
