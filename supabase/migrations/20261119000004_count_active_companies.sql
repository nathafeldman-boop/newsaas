-- Page d'accueil B (test A/B du 19/11) : nombre réel d'entreprises qui ont
-- au moins une offre en ligne. Lecture seule, sans donnée personnelle.
create or replace function public.count_active_companies()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(distinct lower(trim(company)))::int
  from offers
  where is_active and company is not null and company !~* 'non communiqu';
$$;

revoke all on function public.count_active_companies() from public;
grant execute on function public.count_active_companies() to service_role;
