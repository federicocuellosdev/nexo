-- v3.referidos
--
-- Programa de referidos: cada fila es UNA invitación que un afiliado le mandó
-- a un amigo por email. `email_status` sigue el ciclo pending → sent (cuando
-- Resend devuelve 200) → failed (si falla el envío).
--
-- `referidor_lead_id` es opcional porque el usuario puede invitar aunque no
-- tenga una fila en v3.leads todavía (sesión declientada tras cleanup, o
-- invitación anónima). Para ese caso guardamos `referidor_email` +
-- `referidor_nombre` que SIEMPRE vienen del portal — así la invitación queda
-- trazada aunque falte el lead.
--
-- Unique (lower(referidor_email), lower(email_invitado)): no tiene sentido
-- mandar 10 invitaciones del mismo referrer al mismo mail. El unique viejo
-- por lead_id no servía cuando el lead es null.

create table if not exists v3.referidos (
  id                  uuid primary key default gen_random_uuid(),
  referidor_lead_id   uuid references v3.leads(id) on delete set null,
  referidor_email     text not null,
  referidor_nombre    text,
  email_invitado      text not null,
  email_status        text not null default 'pending'
                       check (email_status in ('pending','sent','failed')),
  email_provider_id   text,       -- id que devuelve Resend al enviar
  error               text,
  created_at          timestamptz not null default now(),
  sent_at             timestamptz
);

create index if not exists referidos_referidor_lead_id_idx
  on v3.referidos (referidor_lead_id);
create index if not exists referidos_referidor_email_idx
  on v3.referidos (lower(referidor_email));
create unique index if not exists referidos_email_pair_uq
  on v3.referidos (lower(referidor_email), lower(email_invitado));
