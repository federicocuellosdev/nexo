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
      /** Calle + número ya concatenados (ej. "Córdoba 1234"). SF no tiene
       *  campo `number` separado — todo va a `street`. */
      street: string;
      floor?: string;
      apartment?: string;
      tower?: string;
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
  /**
   * `payment.id` de MP del pago ya cobrado (cuota de ingreso). Viaja en
   * `firstPayment.paymentReference` — SF lo usa para correlacionar con la
   * Payment-Confirmation-API cuando esta exista. Sin este dato la cuenta
   * queda en `InPreparation` indefinidamente aunque MP haya cobrado OK.
   */
  paymentReference?: string | null;
  /** Fecha de vigencia opcional. Si null, SF usa hoy. */
  effectiveDate?: string | null;
}

export interface SaleIntakePayload {
  messageId: string;
  sentAt: string;
  salesChannel: 'Nexo';
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
      floor?: string;
      apartment?: string;
      tower?: string;
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
  declaredMembersCount: number;
  seniorMembersCount: number;
  offers: Array<{ offerCode: string }>;
  /**
   * PaymentMethod del schema no tiene `amount` — solo `method`,
   * `accountNumber`, `cardExpirationMonth/Year` y `paymentReference`. El
   * amount sale del offer, no del payload. SF ignoraba el `amount: 0` que
   * mandábamos antes.
   */
  firstPayment: { method: 'MercadoPago'; paymentReference?: string };
  recurringPayment: { method: 'MercadoPago' };
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
  // `paymentReference` debe ser solo dígitos (pattern del schema). MP payment.id
  // viene como number, lo stringifeamos y filtramos no-dígitos defensivamente.
  const refDigits = sale.paymentReference ? String(sale.paymentReference).replace(/\D/g, '') : '';
  // declaredMembersCount: titular + beneficiarios. seniorMembersCount lo
  // dejamos en 0 hasta que tengamos edades de los beneficiarios cargadas.
  const declaredMembers = 1 + sale.beneficiaries.length;
  return {
    messageId: randomUUID(),
    sentAt: new Date().toISOString(),
    salesChannel: 'Nexo',
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
        ...(sale.policyholder.address.floor ? { floor: sale.policyholder.address.floor } : {}),
        ...(sale.policyholder.address.apartment
          ? { apartment: sale.policyholder.address.apartment }
          : {}),
        ...(sale.policyholder.address.tower ? { tower: sale.policyholder.address.tower } : {}),
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
    declaredMembersCount: declaredMembers,
    seniorMembersCount: 0,
    offers: [{ offerCode: sale.offerCode }],
    firstPayment: {
      method: 'MercadoPago',
      ...(refDigits ? { paymentReference: refDigits } : {}),
    },
    recurringPayment: { method: 'MercadoPago' },
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
      // El monto real sale del offer en SF, no del payload. Mock lo expone
      // igual para que los consumidores que lo lean en dev no se rompan.
      totalAmount: 0,
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
