import { useNavigate } from 'react-router';
import { setSession, useSession } from '@/mock/session';
import { PerfilWizard, type DatosDelWizard } from '@/features/perfil/PerfilWizard';
import { BORRADOR_BENEFICIARIO, BORRADOR_DEMO, BORRADOR_INICIAL } from '@/features/perfil/validacion';
import { guardarPerfilBackend } from '@/lib/api';

/**
 * En staging/test precargamos el wizard con `BORRADOR_DEMO` para que el
 * recorrido sea Enter→Enter→Enter→Guardar. En producción arrancamos vacío
 * (`BORRADOR_INICIAL`) para no ensuciarle los datos reales al usuario.
 *
 * El flag se setea en Vercel como `VITE_DEMO_PREFILL=true` en `nexo-front`
 * (staging). En el proyecto de producción no se declara y `BORRADOR_INICIAL`
 * se usa por default — fail-safe correcto.
 */
const DEMO_PREFILL = import.meta.env.VITE_DEMO_PREFILL === 'true';

export function PerfilCompletar() {
  const navegar = useNavigate();
  const sesion = useSession();
  const usuario = sesion.usuario;
  const dniLead = sesion.dniLead;
  const familiares = sesion.familiares ?? 0;
  const leadId = sesion.leadId;

  async function guardar({ perfil, identidad }: DatosDelWizard) {
    // El nombre va sobre `usuario`, NO dentro de `perfil`: es de donde lo leen
    // el saludo de /inicio, las iniciales del avatar y /cuenta.
    setSession({ perfil, ...(usuario ? { usuario: { ...usuario, ...identidad } } : {}) });

    // Persistir al backend si tenemos leadId. Si falla, seguimos igual — la
    // sesion local tiene el perfil y el usuario puede retomar; un job podrá
    // reintentar después. NO bloqueamos al usuario con un error.
    if (leadId) {
      try {
        await guardarPerfilBackend(leadId, {
          perfil: {
            tipoDocumento: perfil.tipoDocumento,
            numeroDocumento: perfil.numeroDocumento,
            sexo: perfil.sexo,
            fechaNacimiento: perfil.fechaNacimiento,
            domicilio: perfil.domicilio,
            tieneObraSocial: perfil.tieneObraSocial,
            ...(perfil.obraSocial ? { obraSocial: perfil.obraSocial } : {}),
            tipoContratacion: perfil.tipoContratacion,
          },
          beneficiarios: perfil.beneficiarios ?? [],
          familiaresCount: familiares,
        });
      } catch (err) {
        console.warn('[perfil] no se pudo persistir al backend', err);
      }
    }

    // El aviso "Cobertura activa" lo muestra /inicio al recibir este state.
    void navegar('/inicio', { replace: true, state: { coberturaActivada: true } });
  }

  // Total de pasos = 4 del titular + N familiares. El subtitulo lo usa y
  // también sirve para el "son X pasos cortos" condicional.
  const totalPasos = 4 + familiares - (dniLead ? 1 : 0);

  return (
    <div className="mx-auto max-w-[560px]">
      <h1 className="text-2xl text-ink-950">Completá tu perfil</h1>
      <p className="mt-2 text-sm text-ink-600">
        {`Previnca necesita estos datos para activar tu cobertura. Son ${totalPasos} pasos cortos.`}
      </p>
      <div className="mt-6">
        {/* Pre-cargado con datos de prueba (BORRADOR_DEMO) para facilitar el
            recorrido clickeable de la maqueta: recorrer el wizard es
            Enter → Enter → Enter → Guardar. Nombre y apellido vienen del alta
            de la landing; si no están (login sólo con email) quedan vacíos.
            Si ya tenemos el DNI del alta (dniLead), lo precargamos y
            arrancamos en el paso 2 para no volver a pedirlo — el DNI igual
            queda en perfil.numeroDocumento al guardar.

            Beneficiarios: creamos un slot vacío por cada familiar declarado
            en /inicio (`sesion.familiares`). El wizard se encarga de agregar
            un paso por slot. Si el usuario vuelve y cambia el nº de
            familiares, el `key` fuerza el remount y re-genera los slots. */}
        <PerfilWizard
          key={`${dniLead ?? 'sin-dni'}-${familiares}`}
          borradorInicial={{
            ...(DEMO_PREFILL ? BORRADOR_DEMO : BORRADOR_INICIAL),
            nombre: usuario?.nombre ?? '',
            apellido: usuario?.apellido ?? '',
            ...(dniLead ? { tipoDocumento: 'DNI' as const, numeroDocumento: dniLead } : {}),
            beneficiarios: Array.from({ length: familiares }, () => ({ ...BORRADOR_BENEFICIARIO })),
          }}
          pasoInicial={dniLead ? 2 : 1}
          // Devolvemos el promise para que el wizard pueda awaitear y mostrar
          // "Guardando…" + spinner mientras POSTeamos a /leads/:id/perfil.
          onGuardar={guardar}
        />
      </div>
    </div>
  );
}
