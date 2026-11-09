-- v3.referidos
--
-- Programa de referidos: cada fila es UNA invitación que un afiliado le mandó
-- a un amigo por email. `referidor_lead_id` apunta al lead que invita;
-- `email_invitado` es a quién. `email_status` sigue el ciclo pending → sent
-- (cuando Resend devuelve 200) → failed (si falla el envío).
--
-- Unique (referidor_lead_id, email_invitado): no tiene sentido mandarle 10
-- invitaciones al mismo mail. Si alguien quiere re-invitar, borra la anterior.

create table if not exists v3.referidos (
  id                  uuid primary key default gen_random_uuid(),
  referidor_lead_id   uuid not null references v3.leads(id) on delete cascade,
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
create unique index if not exists referidos_lead_email_uq
  on v3.referidos (referidor_lead_id, lower(email_invitado));
