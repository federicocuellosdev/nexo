import { useState } from 'react';
import type { FormEvent } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';

export interface DialogoEmailMercadoPagoProps {
  valorInicial?: string;
  onCerrar: () => void;
  onConfirmar: (email: string) => void;
}

/**
 * Popup pre-checkout: pide el email de la cuenta de MercadoPago antes de
 * redirigir a /pago. Reutilizado por /inicio (CTA "Terminar de pagar" del
 * plan pendiente) y /planes (CTA "Contratar" de cada plan nuevo) — cada vez
 * que arranca una suscripción hay que capturar la cuenta MP a asociar.
 *
 * Usa Radix Dialog directo (no el wrapper `Dialog` compartido) porque centra
 * ícono + título + descripción dentro del body, en vez del header lateral.
 */
export function DialogoEmailMercadoPago({
  valorInicial = '',
  onCerrar,
  onConfirmar,
}: DialogoEmailMercadoPagoProps) {
  const [valor, setValor] = useState(valorInicial);
  const [error, setError] = useState<string | undefined>();

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const limpio = valor.trim();
    if (limpio === '') {
      setError('Ingresá tu email de Mercado Pago');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(limpio)) {
      setError('Revisá el formato del email');
      return;
    }
    onConfirmar(limpio);
  }

  return (
    <RadixDialog.Root
      open
      onOpenChange={(abierto) => {
        if (!abierto) onCerrar();
      }}
    >
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-ink-950/40 transition-opacity duration-200 ease-out-quart starting:opacity-0" />
        <RadixDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-card bg-white p-6 shadow-flotante transition-[opacity,transform] duration-250 ease-out-expo starting:opacity-0 motion-safe:starting:scale-95 motion-reduce:transition-[opacity] max-h-[85dvh]">
          <RadixDialog.Close
            aria-label="Cerrar"
            className="absolute right-4 top-4 inline-flex size-8 cursor-pointer items-center justify-center rounded-pill text-ink-500 transition-colors duration-200 hover:bg-ink-100 hover:text-ink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-500"
          >
            <X size={18} aria-hidden="true" />
          </RadixDialog.Close>

          <form onSubmit={enviar} noValidate className="flex flex-col items-center gap-4 text-center">
            {/* `BASE_URL` (/ en dev, /app/ en prod) resuelve el subpath del
                portal sin hardcodear. */}
            <img
              src={`${import.meta.env.BASE_URL}mercadopago.png`}
              alt=""
              aria-hidden="true"
              className="size-14"
            />
            <RadixDialog.Title className="font-display text-xl text-ink-950">
              Pagar con Mercado Pago
            </RadixDialog.Title>
            <RadixDialog.Description className="text-sm text-ink-600">
              Brindanos el email asociado a tu cuenta de Mercado Pago para generar la suscripción.
            </RadixDialog.Description>

            <div className="mt-2 flex w-full flex-col gap-1.5 text-left">
              <Input
                id="mp-email"
                aria-label="Email de Mercado Pago"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoFocus
                placeholder="Email de Mercado Pago"
                value={valor}
                invalido={error !== undefined}
                onChange={(evento) => {
                  setValor(evento.target.value);
                  if (error) setError(undefined);
                }}
              />
              {error ? (
                <p role="alert" className="text-xs text-danger-700">
                  {error}
                </p>
              ) : null}
            </div>
            <Button type="submit" ancho="full" tamano="lg">
              Continuar al pago
            </Button>
          </form>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
