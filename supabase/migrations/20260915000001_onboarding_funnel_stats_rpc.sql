-- Le funnel onboarding sur /admin agrégeait user_events côté JS à partir
-- d'un SELECT sans limite (event_type IN (onboarding_step_viewed,
-- onboarding_step_completed)) -- avec 7 étapes x 2 événements, cette table
-- dépasse largement les 1000 lignes du Max Rows par défaut de l'API
-- Supabase dès quelques centaines d'utilisateurs ayant traversé
-- l'onboarding, exactement le même piège que la LTV tronquée avant le RPC
-- sum_total_paid_cents (migration 20260914000000). Compter côté base
-- (distinct user_id par étape) élimine le risque : un agrégat SQL ne
-- ramène jamais plus de lignes qu'il n'y a d'étapes, quelle que soit la
-- taille de user_events.
create or replace function public.onboarding_funnel_stats()
returns table (step text, viewed_count bigint, completed_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce(v.step, c.step) as step,
    coalesce(v.viewed_count, 0) as viewed_count,
    coalesce(c.completed_count, 0) as completed_count
  from (
    select metadata->>'step' as step, count(distinct user_id) as viewed_count
    from public.user_events
    where event_type = 'onboarding_step_viewed'
    group by metadata->>'step'
  ) v
  full outer join (
    select metadata->>'step' as step, count(distinct user_id) as completed_count
    from public.user_events
    where event_type = 'onboarding_step_completed'
    group by metadata->>'step'
  ) c on v.step = c.step;
$$;
