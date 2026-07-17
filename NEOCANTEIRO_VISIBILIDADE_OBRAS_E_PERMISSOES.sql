-- NeoCanteiro - visibilidade das obras reais e permissões por perfil
-- Execute no SQL Editor do Supabase depois das migrações principais.
--
-- Objetivos:
-- 1. Todo usuário REAL autenticado e com perfil válido enxerga todas as obras.
-- 2. Cada perfil acessa e edita somente os módulos definidos no NeoCanteiro.
-- 3. O acesso demonstrativo local continua separado dos dados reais do Supabase.

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

-- ---------------------------------------------------------------------------
-- OBRAS: todos os perfis reais veem todas as obras.
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
    using (public.is_neocanteiro_user())
  $policy$;

  execute $policy$
    create policy obras_insert_neocanteiro
    on public.obras
    for insert
    to authenticated
    with check (
      public.can_edit_neocanteiro_module('obras')
      and coalesce(to_jsonb(obras)->>'usuario_id', auth.uid()::text) = auth.uid()::text
    )
  $policy$;

  execute $policy$
    create policy obras_update_neocanteiro
    on public.obras
    for update
    to authenticated
    using (public.can_edit_neocanteiro_module('obras'))
    with check (public.can_edit_neocanteiro_module('obras'))
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
-- MÓDULOS PROFISSIONAIS EM workspace_records.
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
    using (public.can_view_neocanteiro_module(module_key))
  $policy$;

  execute $policy$
    create policy workspace_records_insert_neocanteiro
    on public.workspace_records
    for insert
    to authenticated
    with check (
      public.can_edit_neocanteiro_module(module_key)
      and coalesce(created_by, auth.uid()) = auth.uid()
    )
  $policy$;

  execute $policy$
    create policy workspace_records_update_neocanteiro
    on public.workspace_records
    for update
    to authenticated
    using (public.can_edit_neocanteiro_module(module_key))
    with check (public.can_edit_neocanteiro_module(module_key))
  $policy$;

  execute $policy$
    create policy workspace_records_delete_neocanteiro
    on public.workspace_records
    for delete
    to authenticated
    using (public.current_profile_role() in ('administrador', 'admin'))
  $policy$;

  execute 'grant select, insert, update, delete on public.workspace_records to authenticated';
end;
$$;

-- ---------------------------------------------------------------------------
-- TABELAS OPERACIONAIS LEGADAS.
-- Cada tabela recebe a mesma permissão do módulo correspondente.
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
      ('fotos_diario', 'fotos'),
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
      'create policy %I on public.%I for select to authenticated using (public.can_view_neocanteiro_module(%L))',
      target_table || '_select_neocanteiro',
      target_table,
      target_module
    );

    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.can_edit_neocanteiro_module(%L))',
      target_table || '_insert_neocanteiro',
      target_table,
      target_module
    );

    execute format(
      'create policy %I on public.%I for update to authenticated using (public.can_edit_neocanteiro_module(%L)) with check (public.can_edit_neocanteiro_module(%L))',
      target_table || '_update_neocanteiro',
      target_table,
      target_module,
      target_module
    );

    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.can_edit_neocanteiro_module(%L))',
      target_table || '_delete_neocanteiro',
      target_table,
      target_module
    );

    execute format('grant select, insert, update, delete on public.%I to authenticated', target_table);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- LINHA DO TEMPO: somente os perfis autorizados no frontend.
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
    using (public.can_view_neocanteiro_module('timeline'))
  $policy$;

  execute $policy$
    create policy obra_timeline_insert_neocanteiro
    on public.obra_timeline
    for insert
    to authenticated
    with check (
      public.current_profile_role() in ('administrador', 'admin', 'engenheiro')
      and coalesce(created_by, auth.uid()) = auth.uid()
    )
  $policy$;

  execute 'grant select, insert on public.obra_timeline to authenticated';
end;
$$;

-- Fotos são públicas para leitura, mas somente a equipe operacional pode enviar,
-- alterar ou excluir arquivos no Storage.
drop policy if exists fotos_obras_insert on storage.objects;
drop policy if exists fotos_obras_update on storage.objects;
drop policy if exists fotos_obras_delete on storage.objects;

create policy fotos_obras_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('fotos-obras', 'diarios')
  and public.current_profile_role() in ('administrador', 'admin', 'engenheiro', 'estagiario')
);

create policy fotos_obras_update
on storage.objects
for update
to authenticated
using (
  bucket_id in ('fotos-obras', 'diarios')
  and public.current_profile_role() in ('administrador', 'admin', 'engenheiro', 'estagiario')
)
with check (
  bucket_id in ('fotos-obras', 'diarios')
  and public.current_profile_role() in ('administrador', 'admin', 'engenheiro', 'estagiario')
);

create policy fotos_obras_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('fotos-obras', 'diarios')
  and public.current_profile_role() in ('administrador', 'admin', 'engenheiro', 'estagiario')
);

notify pgrst, 'reload schema';
