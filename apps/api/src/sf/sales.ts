import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import { sfPost } from './client.js';

/**
 * Datos necesarios para armar un `/sales` intake. Se llena desde la fila de
 * `v3.leads` al momento del pago autorizado. `beneficiarios` es la lista de
 * familiares adherentes que vino del wizard de perfil.
 */
export interface SaleParaSf {
  leadId: string;
  sfLeadId?: string | null;
  /** Titular */
  policyholder: {
    firstName: string;
    lastName: string;
    email: string;
    documentType: 'DNI' | 'Pasaporte';
    documentNumber: string;
    sex: 'F' | 'M' | 'X';
    birthdate: string;
    mobilePhone?: string;
    address: {
      street: string;
      number: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  /** Beneficiarios adherentes (familiares). Vacío = plan individual. */
  beneficiaries: Array<{
    firstName: string;
    lastName: string;
    documentType: 'DNI' | 'Pasaporte';
    documentNumber: string;
    sex: 'F' | 'M' | 'X';
    birthdate: string;
    relationship: 'conyuge' | 'hijo' | 'padre' | 'madre' | 'otro';
  }>;
  /** Oferta (plan) que el usuario eligió, codificado como `offerCode` en SF. */
  offerCode: string;
  /** Monto del cobro mensual (lo que mandamos a MP). */
  recurringAmount: number;
  /** Monto del primer cobro. Suele coincidir con recurring. */
  firstAmount: number;
  /** Fecha de vigencia opcional. Si null, SF usa hoy. */
  effectiveDate?: string | null;
}

export interface SaleIntakePayload {
  messageId: string;
  sentAt: string;
  leadId?: string;
  policyholder: {
    firstName: string;
    lastName: string;
    email: string;
    documentType: 'DNI' | 'Pasaporte';
    documentNumber: string;
    sex: 'F' | 'M' | 'X';
    birthdate: string;
    mobilePhone?: string;
    address: {
      country: string;
      state: string;
      city: string;
      street: string;
      number: string;
      postalCode: string;
    };
  };
  beneficiaries: Array<{
    firstName: string;
    lastName: string;
    documentType: 'DNI' | 'Pasaporte';
    documentNumber: string;
    sex: 'F' | 'M' | 'X';
    birthdate: string;
    relationship: string;
  }>;
  offers: Array<{ offerCode: string }>;
  firstPayment: { amount: number; method: 'MercadoPago' };
  recurringPayment: { amount: number; method: 'MercadoPago' };
  effectiveDate?: string | null;
}

export interface SaleIntakeAck {
  messageId: string;
  accountId: string;
  accountCode?: string;
  orderId: string;
  orderNumber?: string;
  totalAmount?: number;
  accountStatus?: string;
  leadId?: string;
  policyholderContactId?: string;
}

export function buildSaleIntakeBody(sale: SaleParaSf): SaleIntakePayload {
  return {
    messageId: randomUUID(),
    sentAt: new Date().toISOString(),
    ...(sale.sfLeadId ? { leadId: sale.sfLeadId } : {}),
    policyholder: {
      firstName: sale.policyholder.firstName,
      lastName: sale.policyholder.lastName,
      email: sale.policyholder.email,
      documentType: sale.policyholder.documentType,
      documentNumber: sale.policyholder.documentNumber,
      sex: sale.policyholder.sex,
      birthdate: sale.policyholder.birthdate,
      ...(sale.policyholder.mobilePhone ? { mobilePhone: sale.policyholder.mobilePhone } : {}),
      address: {
        country: sale.policyholder.address.country,
        state: sale.policyholder.address.state,
        city: sale.policyholder.address.city,
        street: sale.policyholder.address.street,
        number: sale.policyholder.address.number,
        postalCode: sale.policyholder.address.postalCode,
      },
    },
    beneficiaries: sale.beneficiaries.map((b) => ({
      firstName: b.firstName,
      lastName: b.lastName,
      documentType: b.documentType,
      documentNumber: b.documentNumber,
      sex: b.sex,
      birthdate: b.birthdate,
      relationship: b.relationship,
    })),
    offers: [{ offerCode: sale.offerCode }],
    firstPayment: { amount: sale.firstAmount, method: 'MercadoPago' },
    recurringPayment: { amount: sale.recurringAmount, method: 'MercadoPago' },
    ...(sale.effectiveDate !== undefined ? { effectiveDate: sale.effectiveDate } : {}),
  };
}

export interface SendSaleResult {
  ok: boolean;
  status: number;
  mock: boolean;
  messageId: string;
  payload: SaleIntakePayload;
  response: SaleIntakeAck | null;
  errorCode?: string;
}

/**
 * Despacha /sales a SF. Con SF_ENABLED=false retorna ack mock (mismos ids
 * derivados del leadId) para que el resto del flujo continúe sin red.
 */
export async function sendSaleIntake(sale: SaleParaSf): Promise<SendSaleResult> {
  const payload = buildSaleIntakeBody(sale);

  if (!config.sf.enabled) {
    const token = sale.leadId.replace(/-/g, '').slice(0, 15).toUpperCase();
    const mockResponse: SaleIntakeAck = {
      messageId: payload.messageId,
      accountId: `MOCK-ACC-${token}`,
      accountCode: `MOCK-${token.slice(0, 8)}`,
      orderId: `MOCK-ORD-${token}`,
      orderNumber: `MOCK-${Date.now()}`,
      totalAmount: sale.recurringAmount,
      accountStatus: 'Active',
    };
    console.log('[sf/sales] MOCK envío (SF_ENABLED=false):', { leadId: sale.leadId, payload });
    return {
      ok: true,
      status: 0,
      mock: true,
      messageId: payload.messageId,
      payload,
      response: mockResponse,
    };
  }

  try {
    const result = await sfPost<SaleIntakeAck>('/sales', payload);
    if (!result.ok || !result.body) {
      console.error('[sf/sales] HTTP no-ok', result.status, result.rawBody);
      // Si la respuesta trae un code conocido (OFFER_NOT_FOUND, etc.) lo
      // extraemos para persistirlo en v3.sf_sync.error_code.
      const errorCode =
        typeof result.rawBody === 'object' && result.rawBody !== null
          ? (result.rawBody as { code?: string; errorCode?: string }).code ??
            (result.rawBody as { errorCode?: string }).errorCode
          : undefined;
      return {
        ok: false,
        status: result.status,
        mock: false,
        messageId: payload.messageId,
        payload,
        response: null,
        errorCode,
      };
    }
    return {
      ok: true,
      status: result.status,
      mock: false,
      messageId: payload.messageId,
      payload,
      response: result.body,
    };
  } catch (err) {
    console.error('[sf/sales] network error:', err instanceof Error ? err.message : err);
    return {
      ok: false,
      status: 0,
      mock: false,
      messageId: payload.messageId,
      payload,
      response: null,
      errorCode: 'sf_network_error',
    };
  }
}
