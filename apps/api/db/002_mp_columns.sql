-- Columnas de MercadoPago sobre v3.leads. Se poblan desde el webhook
-- (POST /api/webhooks/mercadopago) cuando el puente de producción nos
-- reenvía la notificación — ver apps/api/src/routes/webhooks.ts.
--
-- Mientras la materialización completa (afiliado, numeroAfiliado, emails,
-- etc.) viva en el portal de producción, nos alcanza con guardar estas tres
-- columnas para saber si el pago avanzó.

alter table v3.leads
  add column if not exists mp_preapproval_id text,
  add column if not exists mp_status         text,
  add column if not exists mp_updated_at     timestamptz;

-- Index para resolver rápido un webhook cuando llega la segunda notificación
-- de la misma preapproval (status cambia de pending → authorized → cancelled).
create index if not exists leads_mp_preapproval_id_idx
  on v3.leads (mp_preapproval_id);
