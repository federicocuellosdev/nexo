-- Schema dedicado para nexo-v3 dentro del Supabase staging (`icesuzwyfhcpaukserqt`).
-- Convivimos con las tablas de v2 sin pisarlas: todo lo nuevo vive bajo `v3.`.
-- Para aplicar:
--   psql $DB_URL -f apps/api/db/001_init.sql
-- O desde el SQL editor de Supabase: pegar y ejecutar.

create schema if not exists v3;

-- Permite al rol `service_role` leer/escribir en el schema (anon/authenticated
-- NO tienen acceso — toda interacción pasa por el backend Express).
grant usage on schema v3 to service_role;

-- `leads`: cada registro es una captura inicial del landing v3. Guarda lo
-- mínimo necesario para disparar /leads a SF (nombre completo, DNI, fecha nac,
-- domicilio completo con CP) + metadatos de seguimiento (cuándo mandamos el
-- magic link, sfLeadId cuando SF lo devuelva).
--
-- NO forzamos unique en email ni DNI: el usuario puede intentar varias veces
-- antes de llegar al portal, y queremos mantener el histórico de intentos.
create table if not exists v3.leads (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Item que el usuario estaba contratando cuando llenó el form
  item_tipo       text not null check (item_tipo in ('plan', 'producto')),
  item_id         text not null,
  item_nombre     text not null,

  -- Captura inicial del landing: nombre + apellido + email + DNI. Con esto
  -- SF /leads ya devuelve un sfLeadId. El resto es nullable porque se
  -- completa después, desde el portal, para alimentar el /enrich.
  nombre          text not null,
  apellido        text not null,
  email           text not null,
  dni             text not null,
  telefono        text,
  fecha_nacimiento date,
  calle           text,
  numero          text,
  ciudad          text,
  codigo_postal   text,

  -- Tracking del flujo
  magic_link_sent_at timestamptz,
  activated_at       timestamptz,

  -- SF (todavía no se usa pero reservamos los campos para cuando conectemos)
  sf_lead_id      text,
  sf_sent_at      timestamptz
);

create index if not exists leads_email_idx on v3.leads (lower(email));
create index if not exists leads_dni_idx on v3.leads (dni);
create index if not exists leads_created_at_idx on v3.leads (created_at desc);

-- Trigger de updated_at (autoset en cada UPDATE). Usa la función estándar que
-- Postgres no trae: la definimos inline en el schema v3.
create or replace function v3.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists leads_set_updated_at on v3.leads;
create trigger leads_set_updated_at
  before update on v3.leads
  for each row
  execute function v3.set_updated_at();
