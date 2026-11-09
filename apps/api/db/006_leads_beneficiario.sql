-- Beneficiarios como filas propias en v3.leads
--
-- Cada adherente que un titular suma al plan pasa a ser una FILA independiente
-- en `v3.leads`, con:
--   - `es_beneficiario = true` para distinguirlo de un lead de alta normal
--   - `titular_lead_id` apuntando al UUID del titular
--   - `mp_preapproval_id` compartido con todos los adherentes de la misma
--     "tanda" (si el usuario sumó 3 en una sesión, los 3 tienen el mismo id
--     porque fueron a la misma preapproval nueva)
--
-- Nombre, apellido y dni van en las columnas ya existentes de `v3.leads`.
-- Sexo, fecha de nacimiento y relación con el titular viajan dentro de la
-- columna `perfil` (jsonb) que ya existe, para no inflar el schema con 3
-- columnas más usadas solo por beneficiarios.

alter table v3.leads
  add column if not exists es_beneficiario   boolean not null default false,
  add column if not exists titular_lead_id   uuid references v3.leads(id) on delete cascade;

create index if not exists leads_titular_lead_id_idx
  on v3.leads (titular_lead_id)
  where titular_lead_id is not null;

create index if not exists leads_es_beneficiario_idx
  on v3.leads (es_beneficiario)
  where es_beneficiario = true;
