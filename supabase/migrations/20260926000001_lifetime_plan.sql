-- Ajoute le statut "lifetime" (accès à vie, paiement Stripe unique de 70€ --
-- voir premium/actions.ts) comme statut Premium à part entière côté base.
-- subscription_status est une simple colonne text (pas d'enum Postgres),
-- donc aucune migration de schéma n'est requise pour la valeur elle-même --
-- seuls les triggers qui décident "premium ou pas" en dur (voir
-- 20260926000000_hard_paywall_no_free_actions.sql) doivent être mis à jour
-- pour la reconnaître, sinon un acheteur à vie resterait bloqué comme un
-- compte gratuit par enforce_swipe_quota / enforce_premium_application.

create or replace function public.enforce_swipe_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  if new.direction <> 'like' then
    return new;
  end if;

  select subscription_status into v_status
  from public.profiles
  where id = new.user_id;

  if v_status in ('active', 'trialing', 'comp', 'lifetime') then
    return new;
  end if;

  if exists(
    select 1 from public.swipes
    where user_id = new.user_id and offer_id = new.offer_id
  ) then
    return new;
  end if;

  raise exception 'PREMIUM_REQUIRED'
    using errcode = 'P0001',
          hint = 'Liker une offre (= la mettre en favori) est réservé aux comptes Premium.';
end;
$$;

create or replace function public.enforce_premium_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  select subscription_status into v_status
  from public.profiles
  where id = new.user_id;

  if v_status in ('active', 'trialing', 'comp', 'lifetime') then
    return new;
  end if;

  raise exception 'PREMIUM_REQUIRED'
    using errcode = 'P0001',
          hint = 'Candidater est réservé aux comptes Premium.';
end;
$$;
