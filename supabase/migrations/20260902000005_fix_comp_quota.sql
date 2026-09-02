-- enforce_swipe_quota ne reconnaissait que subscription_status 'active'/
-- 'trialing' comme premium : les comptes 'comp' (débloqués via un code
-- d'accès, voir 20260902000004) restaient plafonnés à 4 swipes/semaine par
-- le trigger côté base, alors que isPremium() côté app les traite bien
-- comme premium. Réaligne le trigger sur la même définition.

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

  if v_status in ('active', 'trialing', 'comp') then
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
