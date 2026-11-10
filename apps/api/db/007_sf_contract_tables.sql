-- Una tabla por contrato SF del folder `nexo-integracion-salesforce/v2/`.
--
-- Hasta ahora toda la comunicación SF vivía en `v3.sf_sync` con una columna
-- `operation` discriminadora. Problema: cada contrato tiene columnas de
-- interés distintas (lead_intake solo set-ea `sf_lead_id`; sale_intake set-ea
-- `sf_account_id` + `sf_order_id`; additional_sale va a existir en breve;
-- sales_order es un reporte core distinto a los dos de arriba). Mezclar todo
-- en una sola tabla con 4 columnas nullables de SF ids era ruidoso y las
-- queries por contrato filtraban por un enum que la DB no sabe optimizar.
--
-- Decisión: una tabla por YAML del `v2/`. `v3.sf_sync` queda para los
-- contratos legacy del `v1/` (Lead-Intake, Copayment) hasta que Nespon los
-- migre al v2. El shape se mantiene consistente entre las tres para que un
-- helper único pueda escribir en cualquiera sin lógica extra.
--
--   - v3.sf_sale_intake      → POST /sales       (Sale-Intake-API v2)
--   - v3.sf_additional_sale  → POST /additional-sales (Additional-Sale-API v2)
--   - v3.sf_sales_order      → POST /sales-orders (Sales-Order-API v2)
--
-- `message_id` es el UUID de idempotencia que mandamos a SF. Unique para
-- que un retry que termina en éxito tardío actualice la fila en vez de
-- duplicar. `payload` y `response` como jsonb para no perder nada del
-- ack original (SF cambia campos en minors de contrato cada tanto).

create table if not exists v3.sf_sale_intake (
  id             uuid primary key default gen_random_uuid(),
  lead_id        uuid references v3.leads(id) on delete set null,
  message_id     uuid not null unique,
  endpoint       text not null default '/sales',
  payload        jsonb not null,
  response       jsonb,
  http_status    int,
  status         text not null default 'pending' check (status in ('pending','success','failed')),
  error_code     text,
  sf_account_id  text,
  sf_order_id    text,
  attempts       int not null default 1,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists sf_sale_intake_lead_id_idx on v3.sf_sale_intake (lead_id);
create index if not exists sf_sale_intake_status_idx  on v3.sf_sale_intake (status);

create table if not exists v3.sf_additional_sale (
  id             uuid primary key default gen_random_uuid(),
  lead_id        uuid references v3.leads(id) on delete set null,
  message_id     uuid not null unique,
  endpoint       text not null default '/additional-sales',
  -- Account id del titular cuyo contrato se está ampliando. Lo mandamos como
  -- parte del request, por eso vive en una columna propia (para joinear con
  -- v3.sf_sale_intake sin desarmar el payload jsonb).
  sf_account_id  text,
  payload        jsonb not null,
  response       jsonb,
  http_status    int,
  status         text not null default 'pending' check (status in ('pending','success','failed')),
  error_code     text,
  sf_order_id    text,
  attempts       int not null default 1,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists sf_additional_sale_lead_id_idx     on v3.sf_additional_sale (lead_id);
create index if not exists sf_additional_sale_account_id_idx  on v3.sf_additional_sale (sf_account_id);
create index if not exists sf_additional_sale_status_idx      on v3.sf_additional_sale (status);

create table if not exists v3.sf_sales_order (
  id                uuid primary key default gen_random_uuid(),
  lead_id           uuid references v3.leads(id) on delete set null,
  message_id        uuid not null unique,
  endpoint          text not null default '/sales-orders',
  payload           jsonb not null,
  response          jsonb,
  http_status       int,
  status            text not null default 'pending' check (status in ('pending','success','failed')),
  error_code        text,
  sf_sales_order_id text,
  attempts          int not null default 1,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists sf_sales_order_lead_id_idx on v3.sf_sales_order (lead_id);
create index if not exists sf_sales_order_status_idx  on v3.sf_sales_order (status);
