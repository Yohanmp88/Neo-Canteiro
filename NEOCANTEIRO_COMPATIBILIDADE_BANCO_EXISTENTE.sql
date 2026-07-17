-- NeoCanteiro - compatibilidade com o banco Supabase existente
-- Execute este arquivo antes das demais migrações.
-- Ele não apaga dados existentes.

-- A tabela fotos_diario existente usa data_criacao, enquanto partes novas do
-- frontend consultam created_at. Criamos a coluna compatível preservando os dados.
do $$
begin
  if to_regclass('public.fotos_diario') is not null then
    alter table public.fotos_diario
      add column if not exists created_at timestamptz;

    update public.fotos_diario
    set created_at = coalesce(created_at, data_criacao, now())
    where created_at is null;

    alter table public.fotos_diario
      alter column created_at set default now();

    alter table public.fotos_diario
      alter column created_at set not null;
  end if;
end;
$$;

-- Mantém os campos de perfil usados pela autenticação real.
alter table if exists public.profiles add column if not exists nome text;
alter table if exists public.profiles add column if not exists email text;
alter table if exists public.profiles add column if not exists empresa text;
alter table if exists public.profiles add column if not exists updated_at timestamptz default now();

-- Índices úteis para o histórico cronológico.
create index if not exists fotos_diario_created_at_idx
  on public.fotos_diario (created_at desc);

create index if not exists diario_obra_obra_data_idx
  on public.diario_obra (obra_id, data desc);

create index if not exists tarefas_obra_inicio_idx
  on public.tarefas (obra_id, data_inicio);

notify pgrst, 'reload schema';
