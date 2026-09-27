-- Attribution publicitaire (UTM) : jusqu'ici site_visits/profiles ne
-- capturaient que le code affilié interne (?aff=), rien lié aux pubs
-- (TikTok, Meta...). Sans ça, impossible de savoir combien des visites
-- d'aujourd'hui viennent d'une campagne donnée, ni combien d'entre elles se
-- convertissent en inscription -- exactement la question posée le 27/09
-- après la première pub TikTok (106 clics rapportés par TikTok vs 6
-- inscriptions côté dashboard, sans aucun moyen de les relier).

alter table public.site_visits
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text;

-- Même mécanique que affiliate_id (voir 20260919000000_affiliates.sql) :
-- capturé via un cookie posé au premier atterrissage (proxy.ts), transmis à
-- l'inscription dans raw_user_meta_data, puis copié ici par handle_new_user.
alter table public.profiles
  add column if not exists utm_source text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
  referrer_code text;
  referrer_profile_id uuid;
  aff_code text;
  aff_id uuid;
  signup_utm_source text;
begin
  new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  referrer_code := nullif(new.raw_user_meta_data->>'referred_by_code', '');
  if referrer_code is not null then
    select id into referrer_profile_id from public.profiles where referral_code = upper(referrer_code);
  end if;

  aff_code := nullif(new.raw_user_meta_data->>'affiliate_code', '');
  if aff_code is not null then
    select id into aff_id from public.affiliates where code = upper(aff_code) and status = 'approved';
  end if;

  signup_utm_source := nullif(new.raw_user_meta_data->>'utm_source', '');

  insert into public.profiles (id, email, full_name, referral_code, referred_by, affiliate_id, utm_source)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    new_code,
    referrer_profile_id,
    aff_id,
    signup_utm_source
  );

  if referrer_profile_id is not null then
    insert into public.referrals (referrer_id, referred_id, code)
    values (referrer_profile_id, new.id, upper(referrer_code));
  end if;

  return new;
end;
$$;
