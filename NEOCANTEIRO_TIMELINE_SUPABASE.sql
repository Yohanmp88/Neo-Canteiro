-- NeoCanteiro - Linha do Tempo cronológica da obra
-- Execute depois de:
-- 1. NEOCANTEIRO_PROFISSIONAL_SUPABASE.sql
-- 2. NEOCANTEIRO_CORE_MODULES_PATCH.sql
--
-- Esta migração mantém um histórico permanente de alterações do cronograma,
-- diários e fotos. Os registros continuam salvos mesmo após sair da plataforma.

create extension if not exists pgcrypto;

create table if not exists public.obra_timeline (
  id uuid primary key default gen_random_uuid(),
  obra_id text not null,
  event_date date not null default current_date,
  event_type text not null check (event_type in ('diario', 'foto', 'cronograma', 'compra', 'registro')),
  title text not null,
  description text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  source_table text,
  source_id text,
  created_by uuid references auth.users(id),
  created_by_name text,
  created_at timestamptz not null default now()
);

create index if not exists obra_timeline_obra_date_idx
  on public.obra_timeline (obra_id, event_date desc, created_at desc);

create index if not exists obra_timeline_source_idx
  on public.obra_timeline (source_table, source_id);

create or replace function public.timeline_safe_date(value text, fallback_value timestamptz default now())
returns date
language plpgsql
stable
set search_path = public
as $$
begin
  if value is not null and value ~ '^\d{4}-\d{2}-\d{2}' then
    return substring(value from 1 for 10)::date;
  end if;

  return fallback_value::date;
exception
  when others then
    return fallback_value::date;
end;
$$;

create or replace function public.timeline_profile_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'email', 'Usuário NeoCanteiro');
$$;

create or replace function public.capture_obra_timeline()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_data jsonb := case when tg_op = 'DELETE' then '{}'::jsonb else to_jsonb(new) end;
  old_data jsonb := case when tg_op = 'INSERT' then '{}'::jsonb else to_jsonb(old) end;
  payload jsonb := '{}'::jsonb;
  old_payload jsonb := '{}'::jsonb;
  target_obra_id text;
  target_source_id text;
  target_date date := current_date;
  target_type text := 'registro';
  target_title text := 'Registro da obra';
  target_description text := '';
  module_key text;
  progress_before text;
  progress_after text;
begin
  target_obra_id := coalesce(new_data->>'obra_id', old_data->>'obra_id');
  target_source_id := coalesce(new_data->>'id', old_data->>'id');

  if tg_table_name = 'tarefas' then
    if tg_op = 'UPDATE'
      and coalesce(old_data->>'progresso', '') = coalesce(new_data->>'progresso', '')
      and coalesce(old_data->>'data_inicio', '') = coalesce(new_data->>'data_inicio', '')
      and coalesce(old_data->>'data_termino', '') = coalesce(new_data->>'data_termino', '')
      and coalesce(old_data->>'status', '') = coalesce(new_data->>'status', '')
      and coalesce(old_data->>'status_operacional', '') = coalesce(new_data->>'status_operacional', '') then
      return new;
    end if;

    target_type := 'cronograma';
    target_title := case
      when tg_op = 'INSERT' then 'Serviço adicionado ao cronograma'
      when tg_op = 'DELETE' then 'Serviço removido do cronograma'
      else 'Cronograma atualizado'
    end || ' — ' || coalesce(new_data->>'nome', old_data->>'nome', 'Serviço');

    progress_before := coalesce(old_data->>'progresso', '0');
    progress_after := coalesce(new_data->>'progresso', progress_before);

    target_description := concat_ws(E'\n',
      case when tg_op = 'UPDATE' and progress_before is distinct from progress_after
        then 'Progresso: ' || progress_before || '% → ' || progress_after || '%' end,
      case when tg_op = 'UPDATE' and coalesce(old_data->>'data_inicio', '') is distinct from coalesce(new_data->>'data_inicio', '')
        then 'Início: ' || coalesce(old_data->>'data_inicio', 'não informado') || ' → ' || coalesce(new_data->>'data_inicio', 'não informado') end,
      case when tg_op = 'UPDATE' and coalesce(old_data->>'data_termino', '') is distinct from coalesce(new_data->>'data_termino', '')
        then 'Término: ' || coalesce(old_data->>'data_termino', 'não informado') || ' → ' || coalesce(new_data->>'data_termino', 'não informado') end,
      case when tg_op = 'INSERT' then 'Progresso inicial: ' || progress_after || '%' end,
      case when tg_op = 'DELETE' then 'O serviço foi removido do planejamento atual.' end
    );

  elsif tg_table_name = 'diario_obra' then
    target_type := 'diario';
    target_date := public.timeline_safe_date(coalesce(new_data->>'data', old_data->>'data'), now());
    target_title := case when tg_op = 'INSERT' then 'Diário de obra' else 'Diário de obra atualizado' end;
    target_description := coalesce(new_data->>'servicos_executados', old_data->>'servicos_executados', 'Diário registrado sem descrição dos serviços.');

  elsif tg_table_name = 'workspace_records' then
    module_key := coalesce(new_data->>'module_key', old_data->>'module_key');
    if module_key not in ('diario', 'fotos') then
      if tg_op = 'DELETE' then return old; else return new; end if;
    end if;

    payload := coalesce(new_data->'data', '{}'::jsonb);
    old_payload := coalesce(old_data->'data', '{}'::jsonb);
    target_obra_id := coalesce(new_data->>'obra_id', old_data->>'obra_id');
    target_date := public.timeline_safe_date(coalesce(payload->>'data', old_payload->>'data'), now());

    if module_key = 'diario' then
      target_type := 'diario';
      target_title := case when tg_op = 'INSERT' then 'Diário de obra' else 'Diário de obra atualizado' end;
      target_description := coalesce(payload->>'servicos_executados', old_payload->>'servicos_executados', 'Diário registrado sem descrição dos serviços.');
    else
      target_type := 'foto';
      target_title := coalesce(payload->>'descricao', old_payload->>'descricao', 'Registro fotográfico');
      target_description := concat_ws(' — ', payload->>'etapa', payload->>'local', payload->>'observacoes');
    end if;
  else
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  if target_obra_id is null or target_obra_id = '' then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  insert into public.obra_timeline (
    obra_id,
    event_date,
    event_type,
    title,
    description,
    metadata,
    source_table,
    source_id,
    created_by,
    created_by_name
  ) values (
    target_obra_id,
    target_date,
    target_type,
    target_title,
    coalesce(target_description, ''),
    jsonb_build_object('operation', tg_op, 'old', old_data, 'new', new_data),
    tg_table_name,
    target_source_id,
    auth.uid(),
    public.timeline_profile_name()
  );

  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

create or replace function public.capture_foto_timeline()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_obra_id text;
  target_date date;
  diario_data jsonb;
begin
  select
    to_jsonb(d)->>'obra_id',
    public.timeline_safe_date(to_jsonb(d)->>'data', now()),
    to_jsonb(d)
  into target_obra_id, target_date, diario_data
  from public.diario_obra d
  where d.id = new.diario_id
  limit 1;

  if target_obra_id is null then
    return new;
  end if;

  insert into public.obra_timeline (
    obra_id,
    event_date,
    event_type,
    title,
    description,
    metadata,
    source_table,
    source_id,
    created_by,
    created_by_name
  ) values (
    target_obra_id,
    target_date,
    'foto',
    coalesce(to_jsonb(new)->>'descricao', 'Registro fotográfico'),
    'Foto adicionada ao diário de obra.',
    jsonb_build_object(
      'url', to_jsonb(new)->>'url_foto',
      'diario_id', to_jsonb(new)->>'diario_id',
      'diario', diario_data
    ),
    'fotos_diario',
    to_jsonb(new)->>'id',
    auth.uid(),
    public.timeline_profile_name()
  );

  return new;
end;
$$;

do $$
begin
  if to_regclass('public.tarefas') is not null then
    execute 'drop trigger if exists tarefas_capture_timeline on public.tarefas';
    execute 'create trigger tarefas_capture_timeline after insert or update or delete on public.tarefas for each row execute function public.capture_obra_timeline()';
  end if;

  if to_regclass('public.diario_obra') is not null then
    execute 'drop trigger if exists diario_capture_timeline on public.diario_obra';
    execute 'create trigger diario_capture_timeline after insert or update on public.diario_obra for each row execute function public.capture_obra_timeline()';
  end if;

  if to_regclass('public.fotos_diario') is not null then
    execute 'drop trigger if exists fotos_capture_timeline on public.fotos_diario';
    execute 'create trigger fotos_capture_timeline after insert on public.fotos_diario for each row execute function public.capture_foto_timeline()';
  end if;

  if to_regclass('public.workspace_records') is not null then
    execute 'drop trigger if exists workspace_capture_timeline on public.workspace_records';
    execute 'create trigger workspace_capture_timeline after insert or update on public.workspace_records for each row execute function public.capture_obra_timeline()';
  end if;
end;
$$;

alter table public.obra_timeline enable row level security;

drop policy if exists obra_timeline_select on public.obra_timeline;
drop policy if exists obra_timeline_insert on public.obra_timeline;

create policy obra_timeline_select
on public.obra_timeline
for select
to authenticated
using (public.has_workspace_permission(obra_id, 'view'));

create policy obra_timeline_insert
on public.obra_timeline
for insert
to authenticated
with check (
  public.has_workspace_permission(obra_id, 'edit')
  and coalesce(created_by, auth.uid()) = auth.uid()
);

notify pgrst, 'reload schema';
