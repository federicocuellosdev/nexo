-- v3.afiliados
--
-- Programa de afiliados (vendedores). Cada fila es un partner comercial que
-- comparte su URL personal (`{landing}/catalogo?ref={id}`) para atribuirse
-- las ventas que generen por ese link. No tiene nada que ver con v3.leads:
--  - v3.leads = clientes (gente que contrata una cobertura)
--  - v3.afiliados = vendedores (gente que vende coberturas y cobra comisión)
--
-- email unique: es el identificador humano y evita duplicados por accidente
-- al cargar manual desde el admin.

create table if not exists v3.afiliados (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  apellido   text not null,
  email      text not null,
  dni        text,
  telefono   text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists afiliados_email_lower_uq
  on v3.afiliados (lower(email));

create index if not exists afiliados_created_at_idx
  on v3.afiliados (created_at desc);
