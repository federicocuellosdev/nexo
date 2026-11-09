-- v3.pagos y v3.sf_sync
--
-- `v3.pagos`: una fila por evento de MercadoPago recibido en el webhook. El
-- mismo preapproval genera varias filas a lo largo de su vida (created →
-- updated authorized → updated cancelled, etc.), y cada cobro recurrente trae
-- su propio `mp_payment_id`. Guardamos el payload crudo (`raw`) por si más
-- adelante necesitamos retraer datos que hoy no estamos extrayendo en columnas.
--
-- `v3.sf_sync`: una fila por intento de llamada a la API de Nespon/SF (los 4
-- YAMLs: leads, sales, additional-sales, copayments). `message_id` es el
-- UUID de idempotencia que mandamos a SF — lo marcamos `unique` para que un
-- retry que termina en éxito tardío no cree una fila nueva. Cuatro columnas
-- `sf_*_id` separadas en vez de una `sf_object_id` polimórfica para que las
-- queries por tipo (todas las ventas de un lead, todos los copayments de una
-- cuenta) sean indexables.

create table if not exists v3.pagos (
  id                   uuid primary key default gen_random_uuid(),
  lead_id              uuid references v3.leads(id) on delete set null,
  mp_preapproval_id    text not null,
  mp_payment_id        text,
  payer_email          text,
  monto                numeric not null,
  moneda               text not null default 'ARS',
  status               text not null,
  external_reference   text,
  raw                  jsonb,
  received_at          timestamptz not null default now()
);

create index if not exists pagos_lead_id_idx            on v3.pagos (lead_id);
create index if not exists pagos_mp_preapproval_id_idx  on v3.pagos (mp_preapproval_id);
-- Único parcial: `mp_payment_id` solo existe cuando MP manda eventos de
-- `payment.*`. Para eventos de `subscription_preapproval` queda null y no
-- queremos que el unique dispare ahí.
create unique index if not exists pagos_mp_payment_id_uq
  on v3.pagos (mp_payment_id) where mp_payment_id is not null;

create table if not exists v3.sf_sync (
  id              uuid primary key default gen_random_uuid(),
  lead_id         uuid references v3.leads(id) on delete set null,
  operation       text not null check (operation in ('lead_intake','sale_intake','additional_sale','copayment')),
  endpoint        text not null,
  message_id      uuid not null,
  sf_lead_id      text,
  sf_account_id   text,
  sf_order_id     text,
  sf_coverage_id  text,
  http_status     int,
  status          text not null default 'pending' check (status in ('pending','success','failed')),
  error_code      text,
  payload         jsonb not null,
  response        jsonb,
  attempts        int not null default 1,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists sf_sync_lead_id_idx          on v3.sf_sync (lead_id);
create index if not exists sf_sync_operation_status_idx on v3.sf_sync (operation, status);
create unique index if not exists sf_sync_message_id_uq on v3.sf_sync (message_id);
create index if not exists sf_sync_sf_account_id_idx    on v3.sf_sync (sf_account_id);

-- Trigger para mantener `updated_at` al día cuando se actualiza una fila
-- (reintentos, llegada tardía de la respuesta de SF).
create or replace function v3.set_updated_at() returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists sf_sync_set_updated_at on v3.sf_sync;
create trigger sf_sync_set_updated_at
  before update on v3.sf_sync
  for each row execute function v3.set_updated_at();
