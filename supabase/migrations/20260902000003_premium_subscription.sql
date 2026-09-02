-- Abonnement premium (Stripe) : 7,99€/mois, swipes de découverte limités à 4
-- par semaine pour les comptes gratuits. Candidater reste toujours possible
-- sans restriction (voir la fonction ci-dessous) ; seul l'audit CV est géré
-- côté application (cv-audit-actions.ts).

alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists current_period_end timestamptz;

create unique index if not exists profiles_stripe_customer_id_idx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists profiles_stripe_subscription_id_idx
  on public.profiles (stripe_subscription_id)
  where stripe_subscription_id is not null;

-- Un swipe de "découverte" (like/pass depuis le deck) compte dans le quota
-- hebdomadaire des comptes gratuits. Un swipe qui accompagne une candidature
-- (l'utilisateur a déjà — ou vient d'— appliqué à cette offre) ne compte
-- jamais : candidater reste illimité, seul le fait de parcourir de
-- nouvelles offres est plafonné.
create or replace function public.enforce_swipe_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_already_exists boolean;
  v_has_application boolean;
  v_recent_browse_count integer;
begin
  select subscription_status into v_status
  from public.profiles
  where id = new.user_id;

  if v_status in ('active', 'trialing') then
    return new;
  end if;

  select exists(
    select 1 from public.swipes
    where user_id = new.user_id and offer_id = new.offer_id
  ) into v_already_exists;

  if v_already_exists then
    return new;
  end if;

  select exists(
    select 1 from public.applications
    where user_id = new.user_id and offer_id = new.offer_id
  ) into v_has_application;

  if v_has_application then
    return new;
  end if;

  select count(*) into v_recent_browse_count
  from public.swipes s
  where s.user_id = new.user_id
    and s.created_at >= now() - interval '7 days'
    and not exists (
      select 1 from public.applications a
      where a.user_id = s.user_id and a.offer_id = s.offer_id
    );

  if v_recent_browse_count >= 4 then
    raise exception 'SWIPE_QUOTA_REACHED'
      using errcode = 'P0001',
            hint = 'Quota hebdomadaire de swipes gratuits atteint (4/semaine).';
  end if;

  return new;
end;
$$;

drop trigger if exists swipes_enforce_quota on public.swipes;
create trigger swipes_enforce_quota
  before insert on public.swipes
  for each row execute function public.enforce_swipe_quota();
