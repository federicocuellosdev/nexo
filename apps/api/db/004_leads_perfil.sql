-- Columnas de perfil + beneficiarios sobre v3.leads.
--
-- Hasta ahora v3.leads guardaba solo el "alta" (nombre, apellido, dni, email,
-- plan elegido). Para disparar automáticamente /sales en SF cuando el pago se
-- autoriza necesitamos saber en el backend si el usuario terminó de completar
-- el perfil (sexo, fecha nacimiento, domicilio) y si cargó los N familiares
-- adherentes que había declarado.
--
-- `familiares_count` es lo que el usuario eligió en /inicio (contador en la
-- PlanPendienteCard). El perfil se considera "completo para /sales" cuando
-- `perfil is not null AND jsonb_array_length(beneficiarios) >= familiares_count`.
--
-- `sale_sent_at` marca que el sale_intake ya se disparó para este lead, y es la
-- guarda idempotente que evita re-disparar en cada payment.updated subsiguiente.

alter table v3.leads
  add column if not exists perfil           jsonb,
  add column if not exists beneficiarios    jsonb not null default '[]'::jsonb,
  add column if not exists familiares_count int  not null default 0,
  add column if not exists perfil_updated_at timestamptz,
  add column if not exists sale_sent_at    timestamptz,
  add column if not exists sf_account_id    text,
  add column if not exists sf_order_id      text;

create index if not exists leads_sale_sent_at_idx on v3.leads (sale_sent_at);
