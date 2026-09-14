import { Info, SearchX } from 'lucide-react';
import { useParams } from 'react-router';
import { useSession } from '@/mock/session';
import { derivarEstado } from '@/lib/estado';
import { portalUrl } from '@/lib/urls';
import { credencialDeLaSesion } from '@/features/credencial/datos';
import { CredencialCard } from '@/features/credencial/CredencialCard';
import { LogoNexo } from '@/ui/LogoNexo';
import { Icon } from '@/ui/Icon';
import { EmptyState } from '@/ui/EmptyState';

/**
 * Verificación pública de una credencial. Sin login: es lo que abre una
 * farmacia o una óptica al escanear el QR desde el mostrador.
 *
 * LO QUE ESTA PANTALLA NO PUEDE HACER TODAVÍA, y conviene tenerlo claro antes
 * de mostrarla: en la maqueta los datos viven en el `localStorage` DEL SOCIO.
 * El celular del farmacéutico es otro navegador, con otro storage, así que
 * escaneando de verdad siempre va a caer en "No encontrado". Resuelve
 * únicamente en el mismo equipo donde está la sesión.
 *
 * No es un defecto de esta pantalla: es la consecuencia de que no haya backend
 * (docs/CONTEXTO.md). Queda construida y con el componente compartido para que
 * el día que Federico conecte Supabase lo único que cambie sea de dónde salen
 * los datos — la búsqueda por `affiliate_number` exacto reemplaza la
 * comparación contra la sesión, y nada más.
 */
export function Verificar() {
  const { numero } = useParams();
  const sesion = useSession();

  const credencial = credencialDeLaSesion(sesion);
  // Comparación exacta contra el número guardado, igual que el `where
  // affiliate_number = $1` del 2.0. Nada de normalizar ni de comparar
  // parcialmente: un número de afiliado o coincide o es otro afiliado.
  const coincide = credencial !== undefined && credencial.numeroAfiliado === numero;

  return (
    <div data-entrada className="mx-auto flex min-h-dvh max-w-[440px] flex-col justify-center px-4 py-12">
      <div className="mb-8 flex justify-center">
        <LogoNexo alto={26} etiqueta={null} />
      </div>

      <h1 className="text-center text-2xl text-ink-950">Verificación de credencial</h1>

      {/* Mismo patrón que el aviso de /pago: donde la maqueta simula algo que
          después va a ser real, se dice. */}
      <div className="mt-4 flex items-start gap-3 rounded-card bg-warn-50 p-4" role="note">
        <Icon icono={Info} tono="warn" tamano="sm" />
        <p className="text-sm font-medium text-warn-700">
          Simulación — sin base de datos, sólo resuelve en el equipo del socio
        </p>
      </div>

      <div className="mt-6">
        {coincide ? (
          <div className="flex flex-col gap-4">
            <p role="status" className="text-center text-sm text-ink-600">
              Credencial válida. Los datos son los que Previnca tiene registrados.
            </p>
            {/* El MISMO componente que ve el socio en su portal. En el 2.0 esta
                pantalla reimplementa el JSX a mano y hay que mantener dos
                diseños sincronizados a ojo; acá hay uno solo. */}
            <CredencialCard
              datos={credencial}
              estado={derivarEstado(sesion)}
              origen={portalUrl()}
            />
          </div>
        ) : (
          <EmptyState
            icono={SearchX}
            // h2: cuelga directo del h1 de la pantalla.
            como="h2"
            titulo="No encontrado"
            descripcion={
              numero === undefined
                ? 'La dirección no incluye ningún número de afiliado.'
                : `No hay ninguna credencial activa con el número ${numero}.`
            }
          />
        )}
      </div>
    </div>
  );
}
