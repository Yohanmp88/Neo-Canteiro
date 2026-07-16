-- NeoCanteiro - núcleo profissional de dados editáveis
-- Execute este arquivo no SQL Editor do Supabase.
-- O frontend já funciona em modo demonstração e migra automaticamente para
-- esta tabela quando ela estiver disponível.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- FUNÇÕES AUXILIARES
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- USUÁRIOS POR OBRA E PERMISSÕES
-- ---------------------------------------------------------------------------

create table if not exists public.obra_usuarios (
  id uuid primary key default gen_random_uuid(),
  obra_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  perfil text not null default 'visualizador'
    check (perfil in ('administrador', 'engenheiro', 'estagiario', 'compras', 'financeiro', 'cliente', 'investidor', 'visualizador')),
  pode_visualizar boolean not null default true,
  pode_editar boolean not null default false,
  pode_aprovar boolean not null default false,
  pode_administrar boolean not null default false,
  ativo boolean not null default true,
  criado_por uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (obra_id, user_id)
);

create index if not exists obra_usuarios_obra_idx on public.obra_usuarios (obra_id);
create index if not exists obra_usuarios_user_idx on public.obra_usuarios (user_id);

create trigger obra_usuarios_set_updated_at
before update on public.obra_usuarios
for each row execute function public.set_updated_at();

create or replace function public.has_workspace_permission(target_obra_id text, requested_permission text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  profile_role text;
  allowed boolean;
begin
  if auth.uid() is null then
    return false;
  end if;

  profile_role := public.current_profile_role();

  if profile_role in ('admin', 'administrador', 'engenheiro') then
    return true;
  end if;

  select case requested_permission
    when 'view' then ou.pode_visualizar
    when 'edit' then ou.pode_editar
    when 'approve' then ou.pode_aprovar
    when 'admin' then ou.pode_administrar
    else false
  end
  into allowed
  from public.obra_usuarios ou
  where ou.obra_id = target_obra_id
    and ou.user_id = auth.uid()
    and ou.ativo = true
  limit 1;

  return coalesce(allowed, false);
end;
$$;

-- ---------------------------------------------------------------------------
-- REGISTROS EDITÁVEIS DOS MÓDULOS
-- ---------------------------------------------------------------------------

create table if not exists public.workspace_records (
  id uuid primary key default gen_random_uuid(),
  module_key text not null
    check (module_key in (
      'crm', 'clientes', 'fornecedores', 'materiais', 'compras',
      'financeiro', 'orcamento', 'composicoes', 'abc', 'medicoes',
      'documentos', 'templates', 'usuarios'
    )),
  obra_id text not null,
  data jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_records_data_object check (jsonb_typeof(data) = 'object')
);

create index if not exists workspace_records_module_obra_idx
  on public.workspace_records (module_key, obra_id)
  where archived_at is null;

create index if not exists workspace_records_updated_idx
  on public.workspace_records (updated_at desc);

create index if not exists workspace_records_data_gin_idx
  on public.workspace_records using gin (data jsonb_path_ops);

create trigger workspace_records_set_updated_at
before update on public.workspace_records
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- AUDITORIA
-- ---------------------------------------------------------------------------

create table if not exists public.workspace_audit (
  id bigserial primary key,
  record_id uuid,
  module_key text not null,
  obra_id text not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'ARCHIVE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now()
);

create index if not exists workspace_audit_record_idx on public.workspace_audit (record_id, changed_at desc);
create index if not exists workspace_audit_obra_idx on public.workspace_audit (obra_id, changed_at desc);

create or replace function public.audit_workspace_record()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  audit_action text;
begin
  if tg_op = 'INSERT' then
    audit_action := 'INSERT';
    insert into public.workspace_audit (record_id, module_key, obra_id, action, new_data, changed_by)
    values (new.id, new.module_key, new.obra_id, audit_action, new.data, coalesce(new.updated_by, new.created_by, auth.uid()));
    return new;
  end if;

  if tg_op = 'UPDATE' then
    audit_action := case
      when old.archived_at is null and new.archived_at is not null then 'ARCHIVE'
      else 'UPDATE'
    end;

    insert into public.workspace_audit (record_id, module_key, obra_id, action, old_data, new_data, changed_by)
    values (new.id, new.module_key, new.obra_id, audit_action, old.data, new.data, coalesce(new.updated_by, auth.uid()));
    return new;
  end if;

  insert into public.workspace_audit (record_id, module_key, obra_id, action, old_data, changed_by)
  values (old.id, old.module_key, old.obra_id, 'DELETE', old.data, auth.uid());
  return old;
end;
$$;

create trigger workspace_records_audit_insert
  after insert on public.workspace_records
  for each row execute function public.audit_workspace_record();

create trigger workspace_records_audit_update
  after update on public.workspace_records
  for each row execute function public.audit_workspace_record();

create trigger workspace_records_audit_delete
  after delete on public.workspace_records
  for each row execute function public.audit_workspace_record();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.obra_usuarios enable row level security;
alter table public.workspace_records enable row level security;
alter table public.workspace_audit enable row level security;

-- Remove políticas anteriores com os mesmos nomes para permitir reexecução.
drop policy if exists obra_usuarios_select on public.obra_usuarios;
drop policy if exists obra_usuarios_manage on public.obra_usuarios;
drop policy if exists workspace_records_select on public.workspace_records;
drop policy if exists workspace_records_insert on public.workspace_records;
drop policy if exists workspace_records_update on public.workspace_records;
drop policy if exists workspace_records_delete on public.workspace_records;
drop policy if exists workspace_audit_select on public.workspace_audit;

create policy obra_usuarios_select
on public.obra_usuarios
for select
to authenticated
using (
  user_id = auth.uid()
  or public.current_profile_role() in ('admin', 'administrador', 'engenheiro')
);

create policy obra_usuarios_manage
on public.obra_usuarios
for all
to authenticated
using (
  public.current_profile_role() in ('admin', 'administrador', 'engenheiro')
  or public.has_workspace_permission(obra_id, 'admin')
)
with check (
  public.current_profile_role() in ('admin', 'administrador', 'engenheiro')
  or public.has_workspace_permission(obra_id, 'admin')
);

create policy workspace_records_select
on public.workspace_records
for select
to authenticated
using (public.has_workspace_permission(obra_id, 'view'));

create policy workspace_records_insert
on public.workspace_records
for insert
to authenticated
with check (
  public.has_workspace_permission(obra_id, 'edit')
  and coalesce(created_by, auth.uid()) = auth.uid()
);

create policy workspace_records_update
on public.workspace_records
for update
to authenticated
using (public.has_workspace_permission(obra_id, 'edit'))
with check (public.has_workspace_permission(obra_id, 'edit'));

create policy workspace_records_delete
on public.workspace_records
for delete
to authenticated
using (public.has_workspace_permission(obra_id, 'admin'));

create policy workspace_audit_select
on public.workspace_audit
for select
to authenticated
using (
  public.has_workspace_permission(obra_id, 'view')
  and (
    public.current_profile_role() in ('admin', 'administrador', 'engenheiro')
    or changed_by = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- VISÃO EXECUTIVA PARA DASHBOARD E IA
-- ---------------------------------------------------------------------------

create or replace view public.workspace_module_metrics
with (security_invoker = true)
as
select
  obra_id,
  module_key,
  count(*) filter (where archived_at is null) as total_registros,
  count(*) filter (
    where archived_at is null
      and lower(coalesce(data->>'status', data->>'etapa', data->>'classe', ''))
        ~ '(atras|vencid|bloquead|rejeitad|perdido|esgotado|revis|baixo)'
  ) as registros_criticos,
  max(updated_at) as ultima_atualizacao
from public.workspace_records
group by obra_id, module_key;

grant select, insert, update, delete on public.workspace_records to authenticated;
grant select on public.workspace_audit to authenticated;
grant select, insert, update, delete on public.obra_usuarios to authenticated;
grant select on public.workspace_module_metrics to authenticated;

grant usage, select on sequence public.workspace_audit_id_seq to authenticated;

notify pgrst, 'reload schema';
