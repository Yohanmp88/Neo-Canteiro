-- NeoCanteiro - transformar investidor@nc.com em login real do Supabase
-- Execute depois de NEOCANTEIRO_VISIBILIDADE_OBRAS_E_PERMISSOES.sql.

update public.profiles p
set
  role = 'investidor',
  nome = coalesce(nullif(p.nome, ''), 'Investidor NeoCanteiro'),
  email = u.email,
  updated_at = now()
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('investidor@nc.com');

select
  u.email,
  p.nome,
  p.role,
  u.email_confirmed_at
from auth.users u
left join public.profiles p on p.id = u.id
where lower(u.email) = lower('investidor@nc.com');
