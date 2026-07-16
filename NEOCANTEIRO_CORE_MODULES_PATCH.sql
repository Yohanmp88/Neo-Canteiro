-- Execute depois de NEOCANTEIRO_PROFISSIONAL_SUPABASE.sql

alter table public.workspace_records
  drop constraint if exists workspace_records_module_key_check;

alter table public.workspace_records
  add constraint workspace_records_module_key_check
  check (module_key in (
    'crm', 'clientes', 'fornecedores', 'materiais', 'compras',
    'financeiro', 'orcamento', 'composicoes', 'abc', 'medicoes',
    'documentos', 'templates', 'usuarios', 'equipe', 'diario', 'fotos'
  ));

notify pgrst, 'reload schema';
