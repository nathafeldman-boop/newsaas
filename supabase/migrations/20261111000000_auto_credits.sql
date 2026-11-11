-- Upsell « candidatures en plus » (11/11, Nathan) :
-- 1. auto_credits : candidatures automatiques achetées en pack (25, 50, 100,
--    250, 500, 1 500, 10 000). Elles servent quand la limite de 100 par jour
--    est atteinte, ou pour un compte Premium sans la formule Auto. Pas
--    d'expiration.
-- 2. auto_pace_free_until : pause de 4 h (25 envois en 4 h) levée jusqu'à
--    cette date, achetée 2 € (24 h).
-- Écrites seulement par le serveur (webhook Stripe, envoi auto) : ajoutées au
-- trigger protect_paid_profile_columns.

alter table public.profiles
  add column if not exists auto_credits integer not null default 0 check (auto_credits >= 0),
  add column if not exists auto_pace_free_until timestamptz;

create or replace function public.protect_paid_profile_columns()
returns trigger
language plpgsql
as $function$
begin
  if current_user = 'authenticated' and (
       new.subscription_status is distinct from old.subscription_status
    or new.current_period_end is distinct from old.current_period_end
    or new.stripe_customer_id is distinct from old.stripe_customer_id
    or new.stripe_subscription_id is distinct from old.stripe_subscription_id
    or new.premium_activated_at is distinct from old.premium_activated_at
    or new.total_paid_cents is distinct from old.total_paid_cents
    or new.subscription_price_cents is distinct from old.subscription_price_cents
    or new.subscription_interval is distinct from old.subscription_interval
    or new.premium_tier is distinct from old.premium_tier
    or new.inbox_address is distinct from old.inbox_address
    or new.auto_credits is distinct from old.auto_credits
    or new.auto_pace_free_until is distinct from old.auto_pace_free_until
  ) then
    raise exception 'Ces informations de paiement ne se modifient pas depuis l''appli.' using errcode = '42501';
  end if;
  return new;
end;
$function$;

-- Ajout atomique (webhook Stripe).
create or replace function public.add_auto_credits(p_user uuid, p_credits integer)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.profiles set auto_credits = auto_credits + greatest(p_credits, 0)
  where id = p_user
  returning auto_credits;
$$;

-- Retrait atomique d'un crédit : null s'il n'en reste plus.
create or replace function public.use_auto_credit(p_user uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.profiles set auto_credits = auto_credits - 1
  where id = p_user and auto_credits > 0
  returning auto_credits;
$$;

-- Remise d'un crédit si l'envoi échoue après le retrait.
create or replace function public.refund_auto_credit(p_user uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.profiles set auto_credits = auto_credits + 1
  where id = p_user
  returning auto_credits;
$$;

revoke all on function public.add_auto_credits(uuid, integer) from public, anon, authenticated;
revoke all on function public.use_auto_credit(uuid) from public, anon, authenticated;
revoke all on function public.refund_auto_credit(uuid) from public, anon, authenticated;
