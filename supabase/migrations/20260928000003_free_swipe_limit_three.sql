-- Revient sur le blocage total du swipe (20260928000002, plus tôt
-- aujourd'hui, "envoie le paywall à chaque swipe") : trop dur, remplacé par
-- un essai gratuit de 3 swipes au total (demande explicite de Nathan, même
-- jour -- "bloque les au bout de 3 swipes", jamais renouvelé). "like" reste
-- lui TOUJOURS réservé Premium, quota ou pas -- c'est l'action
-- monétisable, inchangée depuis le hard paywall du 26/09.

create or replace function public.enforce_swipe_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_swipe_count integer;
begin
  select subscription_status into v_status
  from public.profiles
  where id = new.user_id;

  if v_status in ('active', 'trialing', 'comp', 'lifetime') then
    return new;
  end if;

  -- Idempotence de l'upsert (onConflict user_id,offer_id) : une ligne déjà
  -- enregistrée avant ce changement (ou pendant que l'utilisateur était
  -- Premium) reste modifiable par lui-même, quel que soit son "direction".
  if exists(
    select 1 from public.swipes
    where user_id = new.user_id and offer_id = new.offer_id
  ) then
    return new;
  end if;

  -- "like" (= favori) toujours réservé Premium, indépendamment du quota --
  -- jamais compté comme un des 3 swipes gratuits puisqu'il est de toute
  -- façon bloqué avant.
  if new.direction = 'like' then
    raise exception 'PREMIUM_REQUIRED'
      using errcode = 'P0001',
            hint = 'Liker une offre (= la mettre en favori) est réservé aux comptes Premium.';
  end if;

  select count(*) into v_swipe_count
  from public.swipes
  where user_id = new.user_id;

  if v_swipe_count >= 3 then
    raise exception 'PREMIUM_REQUIRED'
      using errcode = 'P0001',
            hint = 'Essai gratuit de 3 swipes épuisé -- réservé aux comptes Premium au-delà.';
  end if;

  return new;
end;
$$;
