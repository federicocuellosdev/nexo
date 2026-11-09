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
  perfil?: Record<string, unknown> | null;
  beneficiarios?: unknown[];
  familiares_count?: number | null;
  sale_sent_at?: string | null;
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
      'id, nombre, apellido, email, item_id, sf_lead_id, mp_status, perfil, beneficiarios, familiares_count, sale_sent_at',
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
  const bens = Array.isArray(row.beneficiarios) ? row.beneficiarios : [];

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
    beneficiaries: bens.map((b: any) => ({
      firstName: b.nombre,
      lastName: b.apellido,
      documentType: b.tipoDocumento,
      documentNumber: b.numeroDocumento,
      sex: b.sexo,
      birthdate: b.fechaNacimiento,
      relationship: b.relacion,
    })),
    offerCode: row.item_id,
    // TODO: pisar con el monto real del último row en v3.pagos del preapproval.
    // Hoy SF recibe 0 y rechaza si lo necesita — alcanza para probar el flujo.
    recurringAmount: 0,
    firstAmount: 0,
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
