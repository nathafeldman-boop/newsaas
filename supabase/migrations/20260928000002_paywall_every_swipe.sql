-- Durcit le hard paywall (demande explicite de Nathan le 28/09 : "envoie le
-- paywall à chaque swipe") : "pass" n'est plus une exception. Jusqu'ici
-- volontairement laissé libre ("pass" = pure navigation, voir
-- 20260926000000_hard_paywall_no_free_actions.sql -- "ils peuvent voir les
-- cartes") ; un compte gratuit ne peut désormais plus swiper DU TOUT, dans
-- aucun sens, sans être renvoyé vers /premium. Miroir du check client
-- équivalent dans SwipeDeck.tsx (handleSwipeIntent).

create or replace function public.enforce_swipe_quota()
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

  -- Idempotence de l'upsert (onConflict user_id,offer_id) : une ligne déjà
  -- enregistrée avant ce durcissement (ou pendant que l'utilisateur était
  -- Premium) reste modifiable par lui-même, on ne retire jamais un swipe
  -- déjà acquis -- quel que soit son "direction".
  if exists(
    select 1 from public.swipes
    where user_id = new.user_id and offer_id = new.offer_id
  ) then
    return new;
  end if;

  raise exception 'PREMIUM_REQUIRED'
    using errcode = 'P0001',
          hint = 'Swiper une offre est réservé aux comptes Premium.';
end;
$$;
