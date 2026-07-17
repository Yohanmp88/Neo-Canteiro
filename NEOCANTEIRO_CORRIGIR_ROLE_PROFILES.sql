-- NeoCanteiro - correção da restrição de perfis do banco existente
-- Execute antes de repetir NEOCANTEIRO_AUTH_REAL_SUPABASE.sql.
-- Este arquivo não apaga usuários nem registros.

alter table public.profiles
  drop constraint if exists profiles_role_check;

update public.profiles
set role = case
  when lower(btrim(coalesce(role, ''))) in (
    'administrador', 'admin', 'engenheiro', 'estagiario',
    'compras', 'financeiro', 'cliente', 'investidor'
  ) then lower(btrim(role))
  else 'engenheiro'
end;

alter table public.profiles
  add constraint profiles_role_check
  check (role in (
    'administrador', 'admin', 'engenheiro', 'estagiario',
    'compras', 'financeiro', 'cliente', 'investidor'
  ));

notify pgrst, 'reload schema';
