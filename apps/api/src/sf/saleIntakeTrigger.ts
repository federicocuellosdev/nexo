import { supabaseAdmin } from '../lib/supabase.js';
import { sendSaleIntake, type SaleParaSf } from './sales.js';
import { registrarSfSync } from './syncLog.js';
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

  // Monto real: último pago autorizado (status='authorized' para preapproval,
  // 'approved' para payment). Fallback a 0 si no hay row — igual se dispara
  // para que SF arme el Account/Order; si el monto es crítico SF reventará y
  // el error quedará en v3.sf_sync para debug.
  let monto = 0;
  if (row.mp_preapproval_id) {
    const { data: pagoRows } = await supabaseAdmin
      .schema('v3')
      .from('pagos')
      .select('monto, status, mp_payment_id, created_at')
      .eq('mp_preapproval_id', row.mp_preapproval_id)
      .in('status', ['authorized', 'approved'])
      .order('created_at', { ascending: false })
      .limit(1);
    const first = pagoRows?.[0] as { monto?: number } | undefined;
    if (first && typeof first.monto === 'number' && first.monto > 0) {
      monto = first.monto;
    }
  }

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
        street: perfil.domicilio.calle,
        number: perfil.domicilio.numero,
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
    recurringAmount: monto,
    firstAmount: monto,
  };

  const result = await sendSaleIntake(sale);

  await registrarSfSync({
    leadId,
    operation: 'sale_intake',
    endpoint: '/sales',
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
