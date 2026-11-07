import { randomUUID } from 'node:crypto';
import { config } from '@/config.js';
import { sfPost } from '@/sf/client.js';

/**
 * Datos del lead que ya tenemos en `v3.leads`. Lo que el server necesita para
 * armar el payload a SF — intencionalmente desacoplado del row de la DB para
 * poder llamar al mapper desde tests sin tocar Supabase.
 */
export interface LeadParaSf {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  documentNumber: string;
  /** Opcional en el alta inicial. Se enriquece después desde el portal. */
  mobilePhone?: string;
  /** ISO YYYY-MM-DD. Opcional en el alta inicial. */
  birthdate?: string;
  /** Opcional en el alta inicial. Sin address completo, SF deja readyToSell=false. */
  address?: {
    street: string;
    city: string;
    postalCode: string;
  };
  /** Si ya existe un envío previo, lo reusamos para que SF haga merge. */
  sfLeadId?: string | null;
}

/**
 * Payload del endpoint `/leads` de SF. El contrato vive del lado de Nespon
 * (YAML v0.3.x); los campos y nombres son textuales. Las constantes
 * (`salesChannel`, `documentType`, `declaredMembersCount`, `seniorMembersCount`)
 * salen del canal Nexo: afiliado individual, DNI, canal digital.
 */
export interface LeadIntakePayload {
  messageId: string;
  sentAt: string;
  sfLeadId?: string;
  firstName: string;
  lastName: string;
  email: string;
  mobilePhone?: string;
  salesChannel: 'Nexo';
  declaredMembersCount: 1;
  seniorMembersCount: 0;
  documentType: 'DNI';
  documentNumber: string;
  birthdate?: string;
  address?: {
    country: 'Argentina';
    state: 'Santa Fe';
    street: string;
    city: string;
    postalCode: string;
  };
}

export interface LeadIntakeAck {
  leadId: string;
  messageId: string;
  created: boolean;
  matchesExistingPerson: boolean;
  readyToSell: boolean;
  missingForSale: string[];
}

export function buildLeadIntakeBody(lead: LeadParaSf): LeadIntakePayload {
  return {
    messageId: randomUUID(),
    sentAt: new Date().toISOString(),
    ...(lead.sfLeadId ? { sfLeadId: lead.sfLeadId } : {}),
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    ...(lead.mobilePhone ? { mobilePhone: lead.mobilePhone } : {}),
    salesChannel: 'Nexo',
    declaredMembersCount: 1,
    seniorMembersCount: 0,
    documentType: 'DNI',
    documentNumber: lead.documentNumber,
    ...(lead.birthdate ? { birthdate: lead.birthdate } : {}),
    ...(lead.address
      ? {
          address: {
            country: 'Argentina',
            state: 'Santa Fe',
            street: lead.address.street,
            city: lead.address.city,
            postalCode: lead.address.postalCode,
          },
        }
      : {}),
  };
}

export interface SendLeadResult {
  ok: boolean;
  sfLeadId: string | null;
  status: number;
  mock: boolean;
  payload: LeadIntakePayload;
  response: LeadIntakeAck | null;
  error?: string;
}

/**
 * Despacha el lead a Salesforce. Si el flag está desactivado, no hace el POST
 * real — devuelve un sfLeadId mock para que el resto del flujo (persistencia,
 * email, etc.) pueda seguir trabajando sin cambios mientras la integración
 * esté sin credenciales.
 */
export async function sendLeadIntake(lead: LeadParaSf): Promise<SendLeadResult> {
  const payload = buildLeadIntakeBody(lead);

  if (!config.sf.enabled) {
    // Mock determinístico: mismo lead id → mismo sfLeadId mock. Facilita
    // debuggear y correlacionar en logs mientras SF está apagado.
    const mockSfLeadId = `MOCK-${lead.id.replace(/-/g, '').slice(0, 15).toUpperCase()}`;
    console.log('[sf/leads] MOCK envío (SF_ENABLED=false):', {
      sfLeadId: mockSfLeadId,
      payload,
    });
    return {
      ok: true,
      sfLeadId: mockSfLeadId,
      status: 0,
      mock: true,
      payload,
      response: null,
    };
  }

  try {
    const result = await sfPost<LeadIntakeAck>('/leads', payload);
    if (!result.ok || !result.body) {
      console.error('[sf/leads] respuesta HTTP no-ok', result.status, result.rawBody);
      return {
        ok: false,
        sfLeadId: null,
        status: result.status,
        mock: false,
        payload,
        response: null,
        error: 'sf_http_error',
      };
    }
    return {
      ok: true,
      sfLeadId: result.body.leadId,
      status: result.status,
      mock: false,
      payload,
      response: result.body,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[sf/leads] network error:', msg);
    return {
      ok: false,
      sfLeadId: null,
      status: 0,
      mock: false,
      payload,
      response: null,
      error: 'sf_network_error',
    };
  }
}
