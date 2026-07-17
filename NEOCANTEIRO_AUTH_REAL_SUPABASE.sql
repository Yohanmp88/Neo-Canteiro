-- NeoCanteiro - autenticação real e persistência entre aparelhos
-- Execute este arquivo PRIMEIRO no SQL Editor do Supabase.
-- Depois execute, nesta ordem:
-- 1. NEOCANTEIRO_PROFISSIONAL_SUPABASE.sql
-- 2. NEOCANTEIRO_CORE_MODULES_PATCH.sql
-- 3. NEOCANTEIRO_TIMELINE_SUPABASE.sql

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- PERFIS REAIS VINCULADOS AO SUPABASE AUTH
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  email text,
  role text not null default 'engenheiro',
  empresa text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists nome text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists role text default 'engenheiro';
alter table public.profiles add column if not exists empresa text;
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();

update public.profiles
set role = 'engenheiro'
where role is null or btrim(role) = '';

alter table public.profiles alter column role set default 'engenheiro';
alter table public.profiles alter column role set not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_neocanteiro_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  final_role text;
begin
  requested_role := lower(coalesce(new.raw_user_meta_data ->> 'role', new.raw_user_meta_data ->> 'tipo_usuario', 'engenheiro'));

  if requested_role not in ('administrador', 'admin', 'engenheiro', 'estagiario', 'compras', 'financeiro', 'cliente', 'investidor') then
    requested_role := 'engenheiro';
  end if;

  -- O primeiro perfil real do projeto torna-se administrador.
  -- Os seguintes recebem o perfil solicitado ou, por padrão, engenheiro.
  if not exists (
    select 1 from public.profiles p
    where lower(coalesce(p.role, '')) in ('administrador', 'admin')
  ) then
    final_role := 'administrador';
  else
    final_role := requested_role;
  end if;

  insert into public.profiles (id, nome, email, role, empresa)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(coalesce(new.email, ''), '@', 1)),
    new.email,
    final_role,
    new.raw_user_meta_data ->> 'empresa'
  )
  on conflict (id) do update set
    nome = coalesce(excluded.nome, public.profiles.nome),
    email = coalesce(excluded.email, public.profiles.email),
    empresa = coalesce(excluded.empresa, public.profiles.empresa),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_neocanteiro on auth.users;
create trigger on_auth_user_created_neocanteiro
after insert on auth.users
for each row execute function public.handle_new_neocanteiro_user();

-- Cria perfis para usuários que já existiam antes desta migração.
insert into public.profiles (id, nome, email, role, empresa)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'nome', split_part(coalesce(u.email, ''), '@', 1)),
  u.email,
  case
    when lower(coalesce(u.raw_user_meta_data ->> 'role', u.raw_user_meta_data ->> 'tipo_usuario', ''))
      in ('administrador', 'admin', 'engenheiro', 'estagiario', 'compras', 'financeiro', 'cliente', 'investidor')
      then lower(coalesce(u.raw_user_meta_data ->> 'role', u.raw_user_meta_data ->> 'tipo_usuario'))
    else 'engenheiro'
  end,
  u.raw_user_meta_data ->> 'empresa'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- Garante pelo menos um administrador entre os perfis existentes.
do $$
declare
  first_profile uuid;
begin
  if not exists (
    select 1 from public.profiles
    where lower(coalesce(role, '')) in ('administrador', 'admin')
  ) then
    select id into first_profile
    from public.profiles
    order by created_at asc nulls last
    limit 1;

    if first_profile is not null then
      update public.profiles set role = 'administrador' where id = first_profile;
    end if;
  end if;
end;
$$;

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select lower(coalesce(p.role, '')) from public.profiles p where p.id = auth.uid() limit 1),
    ''
  );
$$;

alter table public.profiles enable row level security;

drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_update on public.profiles;

create policy profiles_select
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.current_profile_role() in ('administrador', 'admin', 'engenheiro')
);

create policy profiles_update
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or public.current_profile_role() in ('administrador', 'admin')
)
with check (
  id = auth.uid()
  or public.current_profile_role() in ('administrador', 'admin')
);

grant select, update on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- POLÍTICAS PARA OBRAS REAIS
-- ---------------------------------------------------------------------------

do $$
begin
  if to_regclass('public.obras') is not null then
    execute 'alter table public.obras enable row level security';

    execute 'drop policy if exists obras_select_real on public.obras';
    execute 'drop policy if exists obras_insert_real on public.obras';
    execute 'drop policy if exists obras_update_real on public.obras';
    execute 'drop policy if exists obras_delete_real on public.obras';

    execute $policy$
      create policy obras_select_real
      on public.obras
      for select
      to authenticated
      using (
        public.current_profile_role() in ('administrador', 'admin', 'engenheiro')
        or coalesce(to_jsonb(obras)->>'usuario_id', '') = auth.uid()::text
        or coalesce(to_jsonb(obras)->>'cliente_id', '') = auth.uid()::text
      )
    $policy$;

    execute $policy$
      create policy obras_insert_real
      on public.obras
      for insert
      to authenticated
      with check (
        public.current_profile_role() in ('administrador', 'admin', 'engenheiro')
        and (
          coalesce(to_jsonb(obras)->>'usuario_id', auth.uid()::text) = auth.uid()::text
          or public.current_profile_role() in ('administrador', 'admin')
        )
      )
    $policy$;

    execute $policy$
      create policy obras_update_real
      on public.obras
      for update
      to authenticated
      using (
        public.current_profile_role() in ('administrador', 'admin', 'engenheiro')
        or coalesce(to_jsonb(obras)->>'usuario_id', '') = auth.uid()::text
      )
      with check (
        public.current_profile_role() in ('administrador', 'admin', 'engenheiro')
        or coalesce(to_jsonb(obras)->>'usuario_id', '') = auth.uid()::text
      )
    $policy$;

    execute $policy$
      create policy obras_delete_real
      on public.obras
      for delete
      to authenticated
      using (
        public.current_profile_role() in ('administrador', 'admin')
        or coalesce(to_jsonb(obras)->>'usuario_id', '') = auth.uid()::text
      )
    $policy$;

    execute 'grant select, insert, update, delete on public.obras to authenticated';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- STORAGE PARA FOTOS
-- O frontend atual usa URLs públicas para exibir as imagens.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values
  ('fotos-obras', 'fotos-obras', true),
  ('diarios', 'diarios', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists fotos_obras_select on storage.objects;
drop policy if exists fotos_obras_insert on storage.objects;
drop policy if exists fotos_obras_update on storage.objects;
drop policy if exists fotos_obras_delete on storage.objects;

create policy fotos_obras_select
on storage.objects
for select
to public
using (bucket_id in ('fotos-obras', 'diarios'));

create policy fotos_obras_insert
on storage.objects
for insert
to authenticated
with check (bucket_id in ('fotos-obras', 'diarios'));

create policy fotos_obras_update
on storage.objects
for update
to authenticated
using (bucket_id in ('fotos-obras', 'diarios'))
with check (bucket_id in ('fotos-obras', 'diarios'));

create policy fotos_obras_delete
on storage.objects
for delete
to authenticated
using (bucket_id in ('fotos-obras', 'diarios'));

notify pgrst, 'reload schema';
