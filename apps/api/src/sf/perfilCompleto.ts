/**
 * ¿Están los datos del lead completos para poder disparar `/sales` a SF?
 *
 * La regla: tiene perfil con los campos requeridos (sexo, fecha, domicilio
 * completo) Y la cantidad de beneficiarios cargados matchea la cantidad de
 * familiares que el usuario declaró en la landing/portal. Sin esto NO se
 * dispara sale_intake — el webhook lo deja registrado en v3.pagos pero no
 * avanza con SF.
 */
export interface LeadParaValidar {
  perfil?: unknown;
  beneficiarios?: unknown;
  familiares_count?: number | null;
}

interface PerfilEnLead {
  tipoDocumento?: string;
  numeroDocumento?: string;
  sexo?: string;
  fechaNacimiento?: string;
  domicilio?: {
    calle?: string;
    numero?: string;
    localidad?: string;
    provincia?: string;
    cp?: string;
    pais?: string;
  };
}

export function esPerfilCompleto(lead: LeadParaValidar): boolean {
  const perfil = lead.perfil as PerfilEnLead | null | undefined;
  if (!perfil) return false;

  const camposTitular = [
    perfil.tipoDocumento,
    perfil.numeroDocumento,
    perfil.sexo,
    perfil.fechaNacimiento,
    perfil.domicilio?.calle,
    perfil.domicilio?.numero,
    perfil.domicilio?.localidad,
    perfil.domicilio?.provincia,
    perfil.domicilio?.cp,
    perfil.domicilio?.pais,
  ];
  if (camposTitular.some((c) => !c || String(c).trim() === '')) return false;

  const bens = Array.isArray(lead.beneficiarios) ? lead.beneficiarios : [];
  const esperados = lead.familiares_count ?? 0;
  return bens.length >= esperados;
}
