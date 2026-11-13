-- v3.pagos — idempotencia para eventos `subscription_preapproval`
--
-- El unique parcial `pagos_mp_payment_id_uq` (migración 003) protege contra
-- doble-inserción cuando MP manda un evento `payment.*` con `mp_payment_id`.
-- Pero para eventos `subscription_preapproval`, `mp_payment_id` es null y el
-- unique no aplica. Si el puente de producción reenvía dos veces el mismo
-- evento `subscription_preapproval` (ej. autorización de la preapproval), se
-- insertan dos filas idénticas en `v3.pagos`.
--
-- Esta migración agrega un segundo unique parcial para los eventos donde
-- `mp_payment_id` es null: una preapproval nunca debería tener dos registros
-- con el mismo `status`. El handler del webhook (`routes/webhooks.ts`) ya
-- captura `23505` y lo trata como idempotencia OK, así que no hay cambio de
-- código asociado — basta con ejecutar este SQL.

create unique index if not exists pagos_preapproval_status_uq
  on v3.pagos (mp_preapproval_id, status)
  where mp_payment_id is null;
