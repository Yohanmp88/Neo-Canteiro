-- NeoCanteiro | Planilhas Excel versionadas + biblioteca SINAPI
-- Execute uma única vez no SQL Editor do Supabase.

create extension if not exists pgcrypto;

-- =========================================================
-- PLANILHAS EXCEL POR OBRA
-- =========================================================

create table if not exists public.planilha_datasets (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  nome text not null,
  descricao text,
  active_version_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (obra_id, nome)
);

create table if not exists public.planilha_versoes (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references public.planilha_datasets(id) on delete cascade,
  numero_versao integer not null,
  arquivo_nome text not null,
  aba_nome text,
  colunas jsonb not null default '[]'::jsonb,
  total_linhas integer not null default 0,
  imported_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (dataset_id, numero_versao)
);

alter table public.planilha_datasets
  drop constraint if exists planilha_datasets_active_version_id_fkey;

alter table public.planilha_datasets
  add constraint planilha_datasets_active_version_id_fkey
  foreign key (active_version_id)
  references public.planilha_versoes(id)
  on delete set null;

create table if not exists public.planilha_linhas (
  id uuid primary key default gen_random_uuid(),
  versao_id uuid not null references public.planilha_versoes(id) on delete cascade,
  ordem integer not null,
  dados jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (versao_id, ordem)
);

create index if not exists idx_planilha_datasets_obra on public.planilha_datasets(obra_id, updated_at desc);
create index if not exists idx_planilha_versoes_dataset on public.planilha_versoes(dataset_id, numero_versao desc);
create index if not exists idx_planilha_linhas_versao on public.planilha_linhas(versao_id, ordem);

-- =========================================================
-- BASE SINAPI
-- =========================================================

create table if not exists public.sinapi_referencias (
  id uuid primary key default gen_random_uuid(),
  uf char(2) not null,
  referencia date not null,
  regime text not null default 'nao_desonerado',
  arquivo_nome text not null,
  total_composicoes integer not null default 0,
  imported_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (uf, referencia, regime)
);

create table if not exists public.sinapi_composicoes (
  id uuid primary key default gen_random_uuid(),
  referencia_id uuid not null references public.sinapi_referencias(id) on delete cascade,
  codigo text not null,
  descricao text not null,
  unidade text,
  categoria text,
  custo_total numeric(18,6) not null default 0,
  dados jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (referencia_id, codigo)
);

create table if not exists public.sinapi_composicao_itens (
  id uuid primary key default gen_random_uuid(),
  composicao_id uuid not null references public.sinapi_composicoes(id) on delete cascade,
  ordem integer not null default 0,
  tipo text,
  codigo text,
  descricao text,
  unidade text,
  coeficiente numeric(18,8),
  preco_unitario numeric(18,6),
  custo_total numeric(18,6),
  dados jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_sinapi_referencias_data on public.sinapi_referencias(referencia desc, uf, regime);
create index if not exists idx_sinapi_composicoes_ref_codigo on public.sinapi_composicoes(referencia_id, codigo);
create index if not exists idx_sinapi_composicoes_descricao on public.sinapi_composicoes using gin (to_tsvector('portuguese', coalesce(descricao, '')));
create index if not exists idx_sinapi_itens_composicao on public.sinapi_composicao_itens(composicao_id, ordem);

-- =========================================================
-- STORAGE PRIVADO PARA ARQUIVOS DE IMPORTAÇÃO
-- =========================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'importacoes',
  'importacoes',
  false,
  52428800,
  array[
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/csv',
    'application/octet-stream'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- O navegador envia o arquivo diretamente ao Storage. A leitura e exclusão
-- são feitas pelo backend usando a chave secreta da Vercel.
drop policy if exists "importacoes_insert_staff" on storage.objects;
create policy "importacoes_insert_staff"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'importacoes'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(p.role) in ('administrador', 'admin', 'engenheiro', 'compras', 'financeiro')
  )
);

-- =========================================================
-- RLS: acesso direto bloqueado; leitura/escrita ocorre pela API validada.
-- =========================================================

alter table public.planilha_datasets enable row level security;
alter table public.planilha_versoes enable row level security;
alter table public.planilha_linhas enable row level security;
alter table public.sinapi_referencias enable row level security;
alter table public.sinapi_composicoes enable row level security;
alter table public.sinapi_composicao_itens enable row level security;

revoke all on public.planilha_datasets from anon, authenticated;
revoke all on public.planilha_versoes from anon, authenticated;
revoke all on public.planilha_linhas from anon, authenticated;
revoke all on public.sinapi_referencias from anon, authenticated;
revoke all on public.sinapi_composicoes from anon, authenticated;
revoke all on public.sinapi_composicao_itens from anon, authenticated;

-- O service_role usado somente no servidor continua com acesso total.

grant all on public.planilha_datasets to service_role;
grant all on public.planilha_versoes to service_role;
grant all on public.planilha_linhas to service_role;
grant all on public.sinapi_referencias to service_role;
grant all on public.sinapi_composicoes to service_role;
grant all on public.sinapi_composicao_itens to service_role;
