import { supabaseAdmin } from '../lib/supabase.js';

/**
 * Operaciones que loggeamos. Hoy tenemos dos capas:
 *
 *   - Contratos del folder `v2/` tienen tabla dedicada:
 *       sale_intake      → v3.sf_sale_intake
 *       additional_sale  → v3.sf_additional_sale
 *       sales_order      → v3.sf_sales_order
 *     Estas usan los helpers `registrarSaleIntake` / `registrarAdditionalSale`
 *     / `registrarSalesOrder` que insertan en la tabla correspondiente.
 *
 *   - Contratos legacy del `v1/` (lead_intake, copayment) siguen cayendo
 *     en `v3.sf_sync` via `registrarSfSync`. Cuando Nespon migre esos
 *     YAMLs al v2, se les hace su tabla y se deprecar v3.sf_sync.
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

/**
 * Shape común para los 3 helpers específicos de v2. `messageId` es la clave
 * de idempotencia — un retry con el mismo messageId actualiza la fila en
 * vez de duplicarla.
 */
export interface SfContractInsert {
  leadId: string | null;
  messageId: string;
  payload: unknown;
  httpStatus?: number | null;
  status?: 'pending' | 'success' | 'failed';
  response?: unknown;
  errorCode?: string | null;
  attempts?: number;
}

export interface SfSaleIntakeInsert extends SfContractInsert {
  sfAccountId?: string | null;
  sfOrderId?: string | null;
}

export async function registrarSaleIntake(fila: SfSaleIntakeInsert): Promise<void> {
  const payload = {
    lead_id: fila.leadId,
    message_id: fila.messageId,
    endpoint: '/sales',
    payload: fila.payload,
    http_status: fila.httpStatus ?? null,
    status: fila.status ?? 'pending',
    response: fila.response ?? null,
    error_code: fila.errorCode ?? null,
    sf_account_id: fila.sfAccountId ?? null,
    sf_order_id: fila.sfOrderId ?? null,
    attempts: fila.attempts ?? 1,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabaseAdmin
    .schema('v3')
    .from('sf_sale_intake')
    .upsert(payload, { onConflict: 'message_id' });
  if (error) console.warn('[sf/syncLog] no se pudo insertar en v3.sf_sale_intake', error);
}

export interface SfAdditionalSaleInsert extends SfContractInsert {
  /** Account titular sobre el que se agrega la venta. */
  sfAccountId?: string | null;
  sfOrderId?: string | null;
}

export async function registrarAdditionalSale(fila: SfAdditionalSaleInsert): Promise<void> {
  const payload = {
    lead_id: fila.leadId,
    message_id: fila.messageId,
    endpoint: '/additional-sales',
    payload: fila.payload,
    http_status: fila.httpStatus ?? null,
    status: fila.status ?? 'pending',
    response: fila.response ?? null,
    error_code: fila.errorCode ?? null,
    sf_account_id: fila.sfAccountId ?? null,
    sf_order_id: fila.sfOrderId ?? null,
    attempts: fila.attempts ?? 1,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabaseAdmin
    .schema('v3')
    .from('sf_additional_sale')
    .upsert(payload, { onConflict: 'message_id' });
  if (error) console.warn('[sf/syncLog] no se pudo insertar en v3.sf_additional_sale', error);
}

export interface SfSalesOrderInsert extends SfContractInsert {
  sfSalesOrderId?: string | null;
}

export async function registrarSalesOrder(fila: SfSalesOrderInsert): Promise<void> {
  const payload = {
    lead_id: fila.leadId,
    message_id: fila.messageId,
    endpoint: '/sales-orders',
    payload: fila.payload,
    http_status: fila.httpStatus ?? null,
    status: fila.status ?? 'pending',
    response: fila.response ?? null,
    error_code: fila.errorCode ?? null,
    sf_sales_order_id: fila.sfSalesOrderId ?? null,
    attempts: fila.attempts ?? 1,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabaseAdmin
    .schema('v3')
    .from('sf_sales_order')
    .upsert(payload, { onConflict: 'message_id' });
  if (error) console.warn('[sf/syncLog] no se pudo insertar en v3.sf_sales_order', error);
}
