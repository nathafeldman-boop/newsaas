-- Tuto de swipe (21/11, Nathan) : à l'arrivée sur le swipe, un mini tuto
-- fait faire un like (gratuit) puis un « passer ». Ce like part dans ses
-- favoris, mais il faut Premium pour y accéder. Règles pour un compte
-- gratuit : UN like en tout (celui du tuto), et les 3 swipes gratuits ne
-- comptent que les « passer » (le like du tuto ne les entame pas).
create or replace function public.enforce_swipe_quota()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_status text;
  v_count integer;
begin
  select subscription_status into v_status from public.profiles where id = new.user_id;
  if v_status in ('active', 'trialing', 'comp', 'lifetime') then
    return new;
  end if;

  if exists (select 1 from public.swipes where user_id = new.user_id and offer_id = new.offer_id) then
    return new;
  end if;

  if new.direction = 'like' then
    if exists (select 1 from public.swipes where user_id = new.user_id and direction = 'like') then
      raise exception 'PREMIUM_REQUIRED'
        using errcode = 'P0001',
              hint = 'Liker une offre (= la mettre en favori) est réservé aux comptes Premium (un seul like offert, celui du tuto).';
    end if;
    return new;
  end if;

  select count(*) into v_count from public.swipes where user_id = new.user_id and direction = 'pass';
  if v_count >= 3 then
    raise exception 'PREMIUM_REQUIRED'
      using errcode = 'P0001',
            hint = 'Essai gratuit de 3 swipes épuisé -- réservé aux comptes Premium au-delà.';
  end if;

  return new;
end;
$function$;
