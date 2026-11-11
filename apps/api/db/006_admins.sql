-- v3.admins
--
-- Allowlist de emails con rol admin. El backend expone /api/me/roles que
-- cruza el email del JWT de Supabase con esta tabla: si aparece, devuelve
-- ['cliente', 'admin']; si no, ['cliente']. Todos los usuarios autenticados
-- son clientes por defecto — la fila en v3.admins es la que agrega el rol
-- extra.
--
-- Se maneja por SQL (insert/delete directo con el service role). Si la lista
-- crece a decenas y hay que delegar la administración a Previnca, se levanta
-- a tabla con RLS + UI.

create table if not exists v3.admins (
  email      text primary key,
  created_at timestamptz not null default now()
);

insert into v3.admins (email) values ('fedecuellos@gmail.com')
  on conflict (email) do nothing;
