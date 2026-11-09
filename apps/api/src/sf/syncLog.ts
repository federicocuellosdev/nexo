import { supabaseAdmin } from '../lib/supabase.js';

/**
 * Operaciones que loggeamos en `v3.sf_sync`. Son las 4 integraciones que Nexo
 * expone contra Nespon/SF (los 4 YAMLs en `nexo-integracion-salesforce/`).
 */
export type SfOperation = 'lead_intake' | 'sale_intake' | 'additional_sale' | 'copayment';

export interface SfSyncInsert {
  leadId: string | null;
  operation: SfOperation;
  endpoint: string;
  messageId: string;
  payload: unknown;
  httpStatus?: number | null;
  status?: 'pending' | 'success' | 'failed';
  response?: unknown;
  errorCode?: string | null;
  sfLeadId?: string | null;
  sfAccountId?: string | null;
  sfOrderId?: string | null;
  sfCoverageId?: string | null;
  attempts?: number;
}

/**
 * Inserta (o actualiza vía `messageId` idempotency key) una fila en
 * `v3.sf_sync`. Usa `upsert` sobre `message_id` que tiene unique index:
 * si reintentamos la misma operación, la fila existente se mantiene y
 * se actualizan status/response/attempts en vez de duplicar.
 */
export async function registrarSfSync(fila: SfSyncInsert): Promise<void> {
  const payload = {
    lead_id: fila.leadId,
    operation: fila.operation,
    endpoint: fila.endpoint,
    message_id: fila.messageId,
    payload: fila.payload,
    http_status: fila.httpStatus ?? null,
    status: fila.status ?? 'pending',
    response: fila.response ?? null,
    error_code: fila.errorCode ?? null,
    sf_lead_id: fila.sfLeadId ?? null,
    sf_account_id: fila.sfAccountId ?? null,
    sf_order_id: fila.sfOrderId ?? null,
    sf_coverage_id: fila.sfCoverageId ?? null,
    attempts: fila.attempts ?? 1,
  };

  const { error } = await supabaseAdmin
    .schema('v3')
    .from('sf_sync')
    .upsert(payload, { onConflict: 'message_id' });

  if (error) console.warn('[sf/syncLog] no se pudo insertar en v3.sf_sync', error);
}
