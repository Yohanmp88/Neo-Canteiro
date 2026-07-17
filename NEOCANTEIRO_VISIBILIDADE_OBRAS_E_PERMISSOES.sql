-- NeoCanteiro - visibilidade por obra e permissões por perfil
-- Execute no SQL Editor do Supabase depois das migrações principais.
--
-- Regra de visibilidade:
-- • Administrador, engenheiro, estagiário, compras, financeiro e investidor
--   visualizam todas as obras reais.
-- • Cliente visualiza somente as obras vinculadas a ele em public.obra_usuarios.
-- • As permissões de edição continuam sendo definidas pelo perfil e pelo módulo.

create or replace function public.is_neocanteiro_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_profile_role() in (
    'administrador', 'admin', 'engenheiro', 'estagiario',
    'compras', 'financeiro', 'cliente', 'investidor'
  );
$$;

create or replace function public.can_access_neocanteiro_obra(target_obra_id text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  profile_role text := public.current_profile_role();
begin
  if auth.uid() is null or coalesce(target_obra_id, '') = '' then
    return false;
  end if;

  if profile_role in (
    'administrador', 'admin', 'engenheiro', 'estagiario',
    'compras', 'financeiro', 'investidor'
  ) then
    return true;
  end if;

  if profile_role = 'cliente' then
    return exists (
      select 1
      from public.obra_usuarios ou
      where ou.obra_id = target_obra_id
        and ou.user_id = auth.uid()
        and ou.ativo = true
        and ou.pode_visualizar = true
    );
  end if;

  return false;
end;
$$;

create or replace function public.can_view_neocanteiro_module(target_module text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  profile_role text := public.current_profile_role();
begin
  if auth.uid() is null then
    return false;
  end if;

  if profile_role in ('administrador', 'admin') then
    return true;
  end if;

  if profile_role = 'engenheiro' then
    return target_module <> 'usuarios';
  end if;

  if profile_role = 'estagiario' then
    return target_module in (
      'dashboard', 'cronograma', 'diario', 'fotos',
      'equipe', 'materiais', 'compras'
    );
  end if;

  if profile_role in ('compras', 'financeiro') then
    return target_module in (
      'dashboard', 'materiais', 'compras', 'fornecedores', 'documentos',
      'financeiro', 'orcamento', 'composicoes', 'abc', 'medicoes'
    );
  end if;

  if profile_role = 'cliente' then
    return target_module in (
      'dashboard', 'cronograma', 'ia', 'diario', 'fotos',
      'medicoes', 'documentos', 'financeiro', 'orcamento', 'abc'
    );
  end if;

  if profile_role = 'investidor' then
    return target_module <> 'usuarios';
  end if;

  return false;
end;
$$;

create or replace function public.can_edit_neocanteiro_module(target_module text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  profile_role text := public.current_profile_role();
begin
  if auth.uid() is null then
    return false;
  end if;

  if profile_role in ('administrador', 'admin') then
    return true;
  end if;

  if profile_role = 'engenheiro' then
    return target_module <> 'usuarios';
  end if;

  if profile_role = 'estagiario' then
    return target_module in (
      'cronograma', 'diario', 'fotos', 'equipe', 'materiais', 'compras'
    );
  end if;

  if profile_role in ('compras', 'financeiro') then
    return target_module in (
      'materiais', 'compras', 'fornecedores', 'documentos',
      'financeiro', 'orcamento', 'composicoes', 'abc', 'medicoes'
    );
  end if;

  -- Cliente e investidor real são somente leitura.
  return false;
end;
$$;

create or replace function public.has_workspace_permission(
  target_obra_id text,
  requested_permission text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  profile_role text := public.current_profile_role();
begin
  if not public.can_access_neocanteiro_obra(target_obra_id) then
    return false;
  end if;

  if requested_permission = 'view' then
    return true;
  end if;

  if requested_permission in ('edit', 'approve', 'admin') then
    return profile_role in (
      'administrador', 'admin', 'engenheiro', 'estagiario',
      'compras', 'financeiro'
    );
  end if;

  return false;
end;
$$;

-- ---------------------------------------------------------------------------
-- VÍNCULO ENTRE CLIENTE E OBRA
-- ---------------------------------------------------------------------------

alter table public.obra_usuarios enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'obra_usuarios'
  loop
    execute format('drop policy if exists %I on public.obra_usuarios', policy_record.policyname);
  end loop;
end;
$$;

create policy obra_usuarios_select_neocanteiro
on public.obra_usuarios
for select
to authenticated
using (
  user_id = auth.uid()
  or public.current_profile_role() in ('administrador', 'admin')
);

create policy obra_usuarios_manage_neocanteiro
on public.obra_usuarios
for all
to authenticated
using (public.current_profile_role() in ('administrador', 'admin'))
with check (public.current_profile_role() in ('administrador', 'admin'));

grant select, insert, update, delete on public.obra_usuarios to authenticated;

create or replace function public.vincular_cliente_obra(
  cliente_email text,
  target_obra_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  cliente_user_id uuid;
  cliente_role text;
begin
  if public.current_profile_role() not in ('administrador', 'admin') then
    raise exception 'Apenas administradores podem vincular clientes às obras.';
  end if;

  select u.id, lower(coalesce(p.role, ''))
  into cliente_user_id, cliente_role
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(u.email) = lower(cliente_email)
  limit 1;

  if cliente_user_id is null then
    raise exception 'Cliente não encontrado.';
  end if;

  if cliente_role <> 'cliente' then
    raise exception 'O usuário informado não possui perfil de cliente.';
  end if;

  insert into public.obra_usuarios (
    obra_id,
    user_id,
    perfil,
    pode_visualizar,
    pode_editar,
    pode_aprovar,
    pode_administrar,
    ativo,
    criado_por
  )
  values (
    target_obra_id::text,
    cliente_user_id,
    'cliente',
    true,
    false,
    false,
    false,
    true,
    auth.uid()
  )
  on conflict (obra_id, user_id) do update set
    perfil = 'cliente',
    pode_visualizar = true,
    pode_editar = false,
    pode_aprovar = false,
    pode_administrar = false,
    ativo = true,
    updated_at = now();
end;
$$;

grant execute on function public.vincular_cliente_obra(text, uuid) to authenticated;

create or replace function public.desvincular_cliente_obra(
  cliente_email text,
  target_obra_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  cliente_user_id uuid;
begin
  if public.current_profile_role() not in ('administrador', 'admin') then
    raise exception 'Apenas administradores podem remover clientes das obras.';
  end if;

  select id into cliente_user_id
  from auth.users
  where lower(email) = lower(cliente_email)
  limit 1;

  update public.obra_usuarios
  set ativo = false, updated_at = now()
  where obra_id = target_obra_id::text
    and user_id = cliente_user_id;
end;
$$;

grant execute on function public.desvincular_cliente_obra(text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- PERFIS: cada usuário vê o próprio perfil; administração vê todos.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_update on public.profiles;
drop policy if exists profiles_select_neocanteiro on public.profiles;
drop policy if exists profiles_update_neocanteiro on public.profiles;

create policy profiles_select_neocanteiro
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.current_profile_role() in ('administrador', 'admin')
);

create policy profiles_update_neocanteiro
on public.profiles
for update
to authenticated
using (public.current_profile_role() in ('administrador', 'admin'))
with check (public.current_profile_role() in ('administrador', 'admin'));

-- ---------------------------------------------------------------------------
-- OBRAS
-- ---------------------------------------------------------------------------

do $$
declare
  policy_record record;
begin
  if to_regclass('public.obras') is null then
    return;
  end if;

  execute 'alter table public.obras enable row level security';

  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'obras'
  loop
    execute format('drop policy if exists %I on public.obras', policy_record.policyname);
  end loop;

  execute $policy$
    create policy obras_select_neocanteiro
    on public.obras
    for select
    to authenticated
    using (public.can_access_neocanteiro_obra(id::text))
  $policy$;

  execute $policy$
    create policy obras_insert_neocanteiro
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
    create policy obras_update_neocanteiro
    on public.obras
    for update
    to authenticated
    using (public.current_profile_role() in ('administrador', 'admin', 'engenheiro'))
    with check (public.current_profile_role() in ('administrador', 'admin', 'engenheiro'))
  $policy$;

  execute $policy$
    create policy obras_delete_neocanteiro
    on public.obras
    for delete
    to authenticated
    using (public.current_profile_role() in ('administrador', 'admin'))
  $policy$;

  execute 'grant select, insert, update, delete on public.obras to authenticated';
end;
$$;

-- ---------------------------------------------------------------------------
-- MÓDULOS PROFISSIONAIS
-- ---------------------------------------------------------------------------

do $$
declare
  policy_record record;
begin
  if to_regclass('public.workspace_records') is null then
    return;
  end if;

  execute 'alter table public.workspace_records enable row level security';

  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'workspace_records'
  loop
    execute format('drop policy if exists %I on public.workspace_records', policy_record.policyname);
  end loop;

  execute $policy$
    create policy workspace_records_select_neocanteiro
    on public.workspace_records
    for select
    to authenticated
    using (
      public.can_access_neocanteiro_obra(obra_id)
      and public.can_view_neocanteiro_module(module_key)
    )
  $policy$;

  execute $policy$
    create policy workspace_records_insert_neocanteiro
    on public.workspace_records
    for insert
    to authenticated
    with check (
      public.can_access_neocanteiro_obra(obra_id)
      and public.can_edit_neocanteiro_module(module_key)
      and coalesce(created_by, auth.uid()) = auth.uid()
    )
  $policy$;

  execute $policy$
    create policy workspace_records_update_neocanteiro
    on public.workspace_records
    for update
    to authenticated
    using (
      public.can_access_neocanteiro_obra(obra_id)
      and public.can_edit_neocanteiro_module(module_key)
    )
    with check (
      public.can_access_neocanteiro_obra(obra_id)
      and public.can_edit_neocanteiro_module(module_key)
    )
  $policy$;

  execute $policy$
    create policy workspace_records_delete_neocanteiro
    on public.workspace_records
    for delete
    to authenticated
    using (
      public.can_access_neocanteiro_obra(obra_id)
      and public.can_edit_neocanteiro_module(module_key)
    )
  $policy$;

  execute 'grant select, insert, update, delete on public.workspace_records to authenticated';
end;
$$;

-- ---------------------------------------------------------------------------
-- TABELAS OPERACIONAIS COM obra_id
-- ---------------------------------------------------------------------------

do $$
declare
  target_table text;
  target_module text;
  policy_record record;
begin
  for target_table, target_module in
    select * from (values
      ('tarefas', 'cronograma'),
      ('diario_obra', 'diario'),
      ('equipe', 'equipe'),
      ('materiais', 'materiais')
    ) as permissions(table_name, module_name)
  loop
    if to_regclass('public.' || target_table) is null then
      continue;
    end if;

    execute format('alter table public.%I enable row level security', target_table);

    for policy_record in
      select policyname
      from pg_policies
      where schemaname = 'public' and tablename = target_table
    loop
      execute format('drop policy if exists %I on public.%I', policy_record.policyname, target_table);
    end loop;

    execute format(
      'create policy %I on public.%I for select to authenticated using (public.can_access_neocanteiro_obra(coalesce(to_jsonb(%I)->>''obra_id'', '''')) and public.can_view_neocanteiro_module(%L))',
      target_table || '_select_neocanteiro', target_table, target_table, target_module
    );

    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.can_access_neocanteiro_obra(coalesce(to_jsonb(%I)->>''obra_id'', '''')) and public.can_edit_neocanteiro_module(%L))',
      target_table || '_insert_neocanteiro', target_table, target_table, target_module
    );

    execute format(
      'create policy %I on public.%I for update to authenticated using (public.can_access_neocanteiro_obra(coalesce(to_jsonb(%I)->>''obra_id'', '''')) and public.can_edit_neocanteiro_module(%L)) with check (public.can_access_neocanteiro_obra(coalesce(to_jsonb(%I)->>''obra_id'', '''')) and public.can_edit_neocanteiro_module(%L))',
      target_table || '_update_neocanteiro', target_table, target_table, target_module,
      target_table, target_module
    );

    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.can_access_neocanteiro_obra(coalesce(to_jsonb(%I)->>''obra_id'', '''')) and public.can_edit_neocanteiro_module(%L))',
      target_table || '_delete_neocanteiro', target_table, target_table, target_module
    );

    execute format('grant select, insert, update, delete on public.%I to authenticated', target_table);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- FOTOS LEGADAS: a obra é obtida pelo diário relacionado.
-- ---------------------------------------------------------------------------

do $$
declare
  policy_record record;
begin
  if to_regclass('public.fotos_diario') is null or to_regclass('public.diario_obra') is null then
    return;
  end if;

  execute 'alter table public.fotos_diario enable row level security';

  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'fotos_diario'
  loop
    execute format('drop policy if exists %I on public.fotos_diario', policy_record.policyname);
  end loop;

  execute $policy$
    create policy fotos_diario_select_neocanteiro
    on public.fotos_diario
    for select
    to authenticated
    using (
      public.can_view_neocanteiro_module('fotos')
      and exists (
        select 1
        from public.diario_obra d
        where d.id = fotos_diario.diario_id
          and public.can_access_neocanteiro_obra(d.obra_id::text)
      )
    )
  $policy$;

  execute $policy$
    create policy fotos_diario_insert_neocanteiro
    on public.fotos_diario
    for insert
    to authenticated
    with check (
      public.can_edit_neocanteiro_module('fotos')
      and exists (
        select 1
        from public.diario_obra d
        where d.id = fotos_diario.diario_id
          and public.can_access_neocanteiro_obra(d.obra_id::text)
      )
    )
  $policy$;

  execute $policy$
    create policy fotos_diario_update_neocanteiro
    on public.fotos_diario
    for update
    to authenticated
    using (
      public.can_edit_neocanteiro_module('fotos')
      and exists (
        select 1
        from public.diario_obra d
        where d.id = fotos_diario.diario_id
          and public.can_access_neocanteiro_obra(d.obra_id::text)
      )
    )
    with check (
      public.can_edit_neocanteiro_module('fotos')
      and exists (
        select 1
        from public.diario_obra d
        where d.id = fotos_diario.diario_id
          and public.can_access_neocanteiro_obra(d.obra_id::text)
      )
    )
  $policy$;

  execute $policy$
    create policy fotos_diario_delete_neocanteiro
    on public.fotos_diario
    for delete
    to authenticated
    using (
      public.can_edit_neocanteiro_module('fotos')
      and exists (
        select 1
        from public.diario_obra d
        where d.id = fotos_diario.diario_id
          and public.can_access_neocanteiro_obra(d.obra_id::text)
      )
    )
  $policy$;

  execute 'grant select, insert, update, delete on public.fotos_diario to authenticated';
end;
$$;

-- ---------------------------------------------------------------------------
-- LINHA DO TEMPO
-- ---------------------------------------------------------------------------

do $$
declare
  policy_record record;
begin
  if to_regclass('public.obra_timeline') is null then
    return;
  end if;

  execute 'alter table public.obra_timeline enable row level security';

  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'obra_timeline'
  loop
    execute format('drop policy if exists %I on public.obra_timeline', policy_record.policyname);
  end loop;

  execute $policy$
    create policy obra_timeline_select_neocanteiro
    on public.obra_timeline
    for select
    to authenticated
    using (
      public.can_access_neocanteiro_obra(obra_id)
      and public.can_view_neocanteiro_module('timeline')
    )
  $policy$;

  execute $policy$
    create policy obra_timeline_insert_neocanteiro
    on public.obra_timeline
    for insert
    to authenticated
    with check (
      public.can_access_neocanteiro_obra(obra_id)
      and public.current_profile_role() in ('administrador', 'admin', 'engenheiro')
      and coalesce(created_by, auth.uid()) = auth.uid()
    )
  $policy$;

  execute 'grant select, insert on public.obra_timeline to authenticated';
end;
$$;

notify pgrst, 'reload schema';
