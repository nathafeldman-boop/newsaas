-- Entonnoir du dashboard (20/11) : comptes créés sur la période, et jusqu'où ils vont.
create or replace function public.admin_funnel(p_start timestamptz, p_end timestamptz)
returns jsonb language sql stable security definer set search_path = public as $$
  with c as (
    select id, onboarding_completed, premium_activated_at, total_paid_cents, created_at
    from profiles where created_at >= p_start and created_at < p_end
  ),
  ev as (
    select user_id,
      bool_or(event_type = 'paywall_viewed') pw,
      bool_or(event_type = 'checkout_opened') co,
      min(created_at) filter (where event_type = 'paywall_viewed') first_pw
    from user_events
    where user_id in (select id from c) and event_type in ('paywall_viewed', 'checkout_opened')
    group by 1
  ),
  sw as (select user_id, count(*) n from swipes where user_id in (select id from c) group by 1)
  select jsonb_build_object(
    'signups', count(*),
    'onboarded', count(*) filter (where c.onboarding_completed),
    'swiped', count(sw.user_id),
    'paywall', count(*) filter (where ev.pw),
    'checkout', count(*) filter (where ev.co),
    'paid', count(*) filter (where c.premium_activated_at is not null),
    'revenue_cents', coalesce(sum(c.total_paid_cents) filter (where c.premium_activated_at is not null), 0),
    'median_swipes', coalesce(percentile_cont(0.5) within group (order by sw.n), 0),
    'median_min_to_paywall', percentile_cont(0.5) within group (order by extract(epoch from ev.first_pw - c.created_at) / 60) filter (where ev.first_pw is not null),
    'median_min_to_pay', percentile_cont(0.5) within group (order by extract(epoch from c.premium_activated_at - c.created_at) / 60) filter (where c.premium_activated_at is not null)
  )
  from c left join ev on ev.user_id = c.id left join sw on sw.user_id = c.id;
$$;
revoke all on function public.admin_funnel(timestamptz, timestamptz) from public;
grant execute on function public.admin_funnel(timestamptz, timestamptz) to service_role;
