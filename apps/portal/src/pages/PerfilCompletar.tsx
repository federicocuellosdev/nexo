import { useNavigate } from 'react-router';
import { setSession, useSession } from '@/mock/session';
import { PerfilWizard, type DatosDelWizard } from '@/features/perfil/PerfilWizard';
import { BORRADOR_INICIAL } from '@/features/perfil/validacion';

export function PerfilCompletar() {
  const navegar = useNavigate();
  const usuario = useSession().usuario;

  function guardar({ perfil, identidad }: DatosDelWizard) {
    // El nombre va sobre `usuario`, NO dentro de `perfil`: es de donde lo leen
    // el saludo de /inicio, las iniciales del avatar y /cuenta.
    setSession({ perfil, ...(usuario ? { usuario: { ...usuario, ...identidad } } : {}) });
    // El aviso "Cobertura activa" lo muestra /inicio al recibir este state.
    void navegar('/inicio', { replace: true, state: { coberturaActivada: true } });
  }

  return (
    <div className="mx-auto max-w-[560px]">
      <h1 className="text-2xl text-ink-950">Completá tu perfil</h1>
      <p className="mt-2 text-sm text-ink-600">
        Previnca necesita estos datos para activar tu cobertura. Son cuatro pasos cortos.
      </p>
      <div className="mt-6">
        {/* Precargado con lo que ya se sabe: quien vino por el alta desde la
            landing escribió nombre y apellido en el formulario, así que sólo
            los confirma. Quien vino por login los completa acá. */}
        <PerfilWizard
          borradorInicial={{
            ...BORRADOR_INICIAL,
            nombre: usuario?.nombre ?? '',
            apellido: usuario?.apellido ?? '',
          }}
          onGuardar={guardar}
        />
      </div>
    </div>
  );
}
