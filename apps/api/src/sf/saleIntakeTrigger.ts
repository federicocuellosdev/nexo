import { supabaseAdmin } from '../lib/supabase.js';
import { sendSaleIntake, type SaleParaSf } from './sales.js';
import { registrarSaleIntake } from './syncLog.js';
import { esPerfilCompleto } from './perfilCompleto.js';

interface LeadRow {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  item_id: string;
  sf_lead_id?: string | null;
  mp_status?: string | null;
  mp_preapproval_id?: string | null;
  perfil?: Record<string, unknown> | null;
  beneficiarios?: unknown[];
  familiares_count?: number | null;
  sale_sent_at?: string | null;
}

interface BeneficiarioRow {
  nombre: string;
  apellido: string;
  perfil: {
    tipoDocumento: 'DNI' | 'Pasaporte';
    numeroDocumento: string;
    sexo: 'F' | 'M' | 'X';
    fechaNacimiento: string;
    relacion: 'conyuge' | 'hijo' | 'padre' | 'madre' | 'otro';
  };
}

/**
 * Mapea el slug del plan (item_id en v3.leads) al offerCode que SF espera.
 * Alineado con portal-v2 (`PLAN_SLUG_TO_OFFER_CODE`): hoy los tres planes Nexo
 * resuelven al mismo código `XTEFO`; si en el futuro se diferencian, se agrega
 * una fila por slug acá.
 */
const PLAN_SLUG_TO_OFFER_CODE: Record<string, string> = {
  'nexo-1': 'XTEFO',
  'nexo-2': 'XTEFO',
  'nexo-3': 'XTEFO',
};

function resolveOfferCode(slug: string): string {
  return PLAN_SLUG_TO_OFFER_CODE[slug] ?? slug;
}

/**
 * Dispara sale_intake si TODAS las condiciones están:
 *   - `mp_status === 'authorized'` (pago confirmado por MP)
 *   - `esPerfilCompleto(lead)` (titular + beneficiarios cargados)
 *   - `sale_sent_at is null` (idempotencia: no re-disparar)
 *
 * Usado desde dos callers con la misma semántica:
 *   - El webhook, cuando el status pasa a authorized.
 *   - `POST /leads/:id/perfil`, cuando el usuario termina de completar el
 *     perfil después de que ya pagó.
 */
export async function maybeDispararSaleIntake(leadId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .schema('v3')
    .from('leads')
    .select(
      'id, nombre, apellido, email, item_id, sf_lead_id, mp_status, mp_preapproval_id, perfil, beneficiarios, familiares_count, sale_sent_at',
    )
    .eq('id', leadId)
    .maybeSingle();

  if (error || !data) {
    console.warn('[sale-intake-trigger] lead no encontrado', leadId, error);
    return;
  }
  const row = data as unknown as LeadRow;

  if (row.sale_sent_at) {
    console.log('[sale-intake-trigger] ya disparado antes, skip', { leadId, sentAt: row.sale_sent_at });
    return;
  }
  if (row.mp_status !== 'authorized') {
    console.log('[sale-intake-trigger] mp_status != authorized, se dispara cuando pague', {
      leadId,
      mp_status: row.mp_status,
    });
    return;
  }
  if (!esPerfilCompleto(row)) {
    console.log('[sale-intake-trigger] perfil incompleto, se dispara cuando el usuario termine', { leadId });
    return;
  }

  const perfil = row.perfil as Record<string, any>;

  // Beneficiarios: filas en v3.leads con `es_beneficiario=true` y
  // `titular_lead_id` = este lead. Esto reemplaza al legacy `row.beneficiarios`
  // jsonb (que sigue existiendo para compat pero no es la fuente de verdad).
  const { data: bensRows, error: errorBens } = await supabaseAdmin
    .schema('v3')
    .from('leads')
    .select('nombre, apellido, perfil')
    .eq('titular_lead_id', leadId)
    .eq('es_beneficiario', true);

  if (errorBens) {
    console.warn('[sale-intake-trigger] no se pudieron leer beneficiarios', leadId, errorBens);
  }
  let bens = (bensRows ?? []) as unknown as BeneficiarioRow[];

  // Fallback: si no hay rows y el /perfil/completar wizard dejó beneficiarios
  // en el jsonb legacy (pre-migración 006), los mapeamos al mismo shape para
  // no perderlos en el sale_intake de leads viejos.
  if (bens.length === 0 && Array.isArray(row.beneficiarios) && row.beneficiarios.length > 0) {
    bens = (row.beneficiarios as any[]).map((b) => ({
      nombre: b.nombre,
      apellido: b.apellido,
      perfil: {
        tipoDocumento: b.tipoDocumento,
        numeroDocumento: b.numeroDocumento,
        sexo: b.sexo,
        fechaNacimiento: b.fechaNacimiento,
        relacion: b.relacion,
      },
    }));
  }

  // mp_payment_id del pago ya cobrado: va a SF como `firstPayment.paymentReference`
  // para que pueda correlacionar con Payment-Confirmation-API cuando esta exista.
  // Buscamos un row con mp_payment_id NO null (los eventos de subscription_preapproval
  // dejan null; los de payment.* traen el id real) y status approved.
  let paymentReference: string | null = null;
  if (row.mp_preapproval_id) {
    const { data: pagoRows } = await supabaseAdmin
      .schema('v3')
      .from('pagos')
      .select('mp_payment_id, status, created_at')
      .eq('mp_preapproval_id', row.mp_preapproval_id)
      .not('mp_payment_id', 'is', null)
      .in('status', ['approved', 'authorized'])
      .order('created_at', { ascending: false })
      .limit(1);
    const first = pagoRows?.[0] as { mp_payment_id?: string | null } | undefined;
    if (first?.mp_payment_id) paymentReference = String(first.mp_payment_id);
  }

  // Street = calle + número concatenados. SF Address schema no tiene campo
  // `number` separado — todo se manda en `street` (ver Sale-Intake-API.yaml).
  const street = `${perfil.domicilio.calle} ${perfil.domicilio.numero}`.trim();
  const piso = typeof perfil.domicilio.piso === 'string' ? perfil.domicilio.piso.trim() : '';
  const depto = typeof perfil.domicilio.departamento === 'string' ? perfil.domicilio.departamento.trim() : '';
  const torre = typeof perfil.domicilio.torre === 'string' ? perfil.domicilio.torre.trim() : '';

  const sale: SaleParaSf = {
    leadId: row.id,
    sfLeadId: row.sf_lead_id ?? null,
    policyholder: {
      firstName: row.nombre,
      lastName: row.apellido,
      email: row.email,
      documentType: perfil.tipoDocumento,
      documentNumber: perfil.numeroDocumento,
      sex: perfil.sexo,
      birthdate: perfil.fechaNacimiento,
      address: {
        street,
        ...(piso ? { floor: piso } : {}),
        ...(depto ? { apartment: depto } : {}),
        ...(torre ? { tower: torre } : {}),
        city: perfil.domicilio.localidad,
        state: perfil.domicilio.provincia,
        postalCode: perfil.domicilio.cp,
        country: perfil.domicilio.pais,
      },
    },
    beneficiaries: bens.map((b) => ({
      firstName: b.nombre,
      lastName: b.apellido,
      documentType: b.perfil.tipoDocumento,
      documentNumber: b.perfil.numeroDocumento,
      sex: b.perfil.sexo,
      birthdate: b.perfil.fechaNacimiento,
      relationship: b.perfil.relacion,
    })),
    offerCode: resolveOfferCode(row.item_id),
    paymentReference,
  };

  const result = await sendSaleIntake(sale);

  await registrarSaleIntake({
    leadId,
    messageId: result.messageId,
    payload: result.payload,
    httpStatus: result.status,
    status: result.ok ? 'success' : 'failed',
    response: result.response,
    errorCode: result.errorCode ?? null,
    sfAccountId: result.response?.accountId ?? null,
    sfOrderId: result.response?.orderId ?? null,
  });

  if (result.ok) {
    await supabaseAdmin
      .schema('v3')
      .from('leads')
      .update({
        sale_sent_at: new Date().toISOString(),
        sf_account_id: result.response?.accountId ?? null,
        sf_order_id: result.response?.orderId ?? null,
      })
      .eq('id', leadId);
  }
}

/**
 * Dispara sale_intake para un BENEFICIARIO (adherente agregado desde
 * /familiares después del alta del titular). Hoy el contrato de SF no expone
 * "alta de Beneficiario" (I-6 pendiente de Nespon), así que el workaround
 * viable con los YAMLs entregados es tratar a cada adherente como SU PROPIA
 * Account: policyholder = beneficiario, beneficiaries=[], own Lead + own Sale.
 * La relación familiar vive solo en nuestra `v3.leads.titular_lead_id`.
 *
 * Idempotente por `sale_sent_at` del propio beneficiario (no del titular).
 * Hereda address + telefono del titular porque no los pedimos en el wizard
 * del adherente; email también usa el del titular (es el único que tenemos).
 */
interface BeneficiarioRowConPerfil {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  mp_preapproval_id?: string | null;
  mp_status?: string | null;
  sf_lead_id?: string | null;
  sale_sent_at?: string | null;
  titular_lead_id?: string | null;
  perfil?: {
    tipoDocumento?: 'DNI' | 'Pasaporte';
    numeroDocumento?: string;
    sexo?: 'F' | 'M' | 'X';
    fechaNacimiento?: string;
    relacion?: 'conyuge' | 'hijo' | 'padre' | 'madre' | 'otro';
  } | null;
}

interface TitularPerfilRow {
  telefono?: string | null;
  perfil?: {
    domicilio?: {
      calle?: string;
      numero?: string;
      piso?: string;
      departamento?: string;
      torre?: string;
      localidad?: string;
      provincia?: string;
      cp?: string;
      pais?: string;
    };
  } | null;
}

export async function dispararAltaDeBeneficiario(beneficiarioLeadId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .schema('v3')
    .from('leads')
    .select(
      'id, nombre, apellido, email, dni, mp_preapproval_id, mp_status, sf_lead_id, sale_sent_at, titular_lead_id, perfil',
    )
    .eq('id', beneficiarioLeadId)
    .eq('es_beneficiario', true)
    .maybeSingle();

  if (error || !data) {
    console.warn('[alta-beneficiario] row no encontrada', beneficiarioLeadId, error);
    return;
  }
  const row = data as unknown as BeneficiarioRowConPerfil;

  if (row.sale_sent_at) {
    console.log('[alta-beneficiario] ya disparado antes, skip', { id: beneficiarioLeadId });
    return;
  }
  if (row.mp_status !== 'authorized') {
    console.log('[alta-beneficiario] mp_status != authorized, se dispara cuando pague', {
      id: beneficiarioLeadId,
    });
    return;
  }
  const perfilBen = row.perfil;
  if (!perfilBen || !perfilBen.sexo || !perfilBen.fechaNacimiento || !perfilBen.tipoDocumento) {
    console.warn('[alta-beneficiario] perfil del beneficiario incompleto', beneficiarioLeadId);
    return;
  }
  if (!row.titular_lead_id) {
    console.warn('[alta-beneficiario] beneficiario sin titular_lead_id', beneficiarioLeadId);
    return;
  }

  // Heredamos address + telefono del titular (al beneficiario nunca se los
  // preguntamos en el wizard). Si el titular todavía no completó su perfil,
  // no podemos seguir: el schema Sale-Intake exige address en el policyholder.
  const { data: titRow } = await supabaseAdmin
    .schema('v3')
    .from('leads')
    .select('telefono, perfil')
    .eq('id', row.titular_lead_id)
    .maybeSingle();
  const titular = (titRow ?? {}) as TitularPerfilRow;
  const dom = titular.perfil?.domicilio;
  if (!dom?.calle || !dom.numero || !dom.localidad || !dom.cp) {
    console.warn('[alta-beneficiario] titular sin domicilio completo, skip', {
      beneficiarioLeadId,
      titularId: row.titular_lead_id,
    });
    return;
  }

  // paymentReference: primer pago approved de la preapproval del beneficiario.
  let paymentReference: string | null = null;
  if (row.mp_preapproval_id) {
    const { data: pagoRows } = await supabaseAdmin
      .schema('v3')
      .from('pagos')
      .select('mp_payment_id, status, created_at')
      .eq('mp_preapproval_id', row.mp_preapproval_id)
      .not('mp_payment_id', 'is', null)
      .in('status', ['approved', 'authorized'])
      .order('created_at', { ascending: false })
      .limit(1);
    const first = pagoRows?.[0] as { mp_payment_id?: string | null } | undefined;
    if (first?.mp_payment_id) paymentReference = String(first.mp_payment_id);
  }

  const street = `${dom.calle} ${dom.numero}`.trim();
  const piso = dom.piso?.trim() ?? '';
  const depto = dom.departamento?.trim() ?? '';
  const torre = dom.torre?.trim() ?? '';

  // offerCode: para alta de adherentes usamos el mismo XTEFO que el titular
  // (monto $15.000 c/u). Si en el futuro hay un offerCode específico para
  // adherente, agregarlo al mapping.
  const sale: SaleParaSf = {
    leadId: row.id,
    sfLeadId: row.sf_lead_id ?? null,
    policyholder: {
      firstName: row.nombre,
      lastName: row.apellido,
      email: row.email, // email del titular (único que tenemos)
      documentType: perfilBen.tipoDocumento,
      documentNumber: perfilBen.numeroDocumento ?? row.dni,
      sex: perfilBen.sexo,
      birthdate: perfilBen.fechaNacimiento,
      mobilePhone: titular.telefono ?? undefined,
      address: {
        street,
        ...(piso ? { floor: piso } : {}),
        ...(depto ? { apartment: depto } : {}),
        ...(torre ? { tower: torre } : {}),
        city: dom.localidad,
        state: dom.provincia ?? 'Santa Fe',
        postalCode: dom.cp,
        country: dom.pais ?? 'Argentina',
      },
    },
    beneficiaries: [],
    offerCode: resolveOfferCode('nexo-2'),
    paymentReference,
  };

  const result = await sendSaleIntake(sale);

  await registrarSaleIntake({
    leadId: beneficiarioLeadId,
    messageId: result.messageId,
    payload: result.payload,
    httpStatus: result.status,
    status: result.ok ? 'success' : 'failed',
    response: result.response,
    errorCode: result.errorCode ?? null,
    sfAccountId: result.response?.accountId ?? null,
    sfOrderId: result.response?.orderId ?? null,
  });

  if (result.ok) {
    await supabaseAdmin
      .schema('v3')
      .from('leads')
      .update({
        sale_sent_at: new Date().toISOString(),
        sf_account_id: result.response?.accountId ?? null,
        sf_order_id: result.response?.orderId ?? null,
      })
      .eq('id', beneficiarioLeadId);
  }
}
