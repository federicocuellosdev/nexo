import { Resend } from 'resend';
import { config } from '@/config.js';

/**
 * Wrapper sobre Resend. Si `RESEND_API_KEY` no está seteado (típico en dev
 * local sin querer mandar correos reales) devolvemos un cliente "no-op" que
 * loguea en consola en lugar de mandar: el endpoint que llama se escribe
 * igual siempre, sin branches por entorno.
 */
interface ClienteEmail {
  enviar(args: { to: string; subject: string; html: string }): Promise<{ id: string | null }>;
}

function clienteNoOp(): ClienteEmail {
  return {
    async enviar({ to, subject }) {
      console.log(`[email no-op] to=${to} subject="${subject}" (RESEND_API_KEY no configurado)`);
      return { id: null };
    },
  };
}

function clienteResend(apiKey: string): ClienteEmail {
  const resend = new Resend(apiKey);
  return {
    async enviar({ to, subject, html }) {
      const { data, error } = await resend.emails.send({
        from: config.resendFrom,
        to,
        subject,
        html,
      });
      if (error) {
        throw new Error(`Resend error: ${error.name} ${error.message}`);
      }
      return { id: data?.id ?? null };
    },
  };
}

export const emailClient: ClienteEmail = config.resendApiKey
  ? clienteResend(config.resendApiKey)
  : clienteNoOp();
