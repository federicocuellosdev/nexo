import { useNavigate } from 'react-router';
import type { PerfilPrevinca } from '@/mock/session';
import { setSession } from '@/mock/session';
import { PerfilWizard } from '@/features/perfil/PerfilWizard';

export function PerfilCompletar() {
  const navegar = useNavigate();

  function guardar(perfil: PerfilPrevinca) {
    setSession({ perfil });
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
        <PerfilWizard onGuardar={guardar} />
      </div>
    </div>
  );
}
