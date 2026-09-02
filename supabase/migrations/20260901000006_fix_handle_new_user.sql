-- Corrige "Database error saving new user" : gen_random_bytes() (pgcrypto)
-- n'est pas résolu par search_path = public quand l'extension est installée
-- dans le schéma "extensions" (comportement par défaut chez Supabase).
-- On remplace par gen_random_uuid(), intégré au coeur de Postgres.

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
begin
  new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  referrer_code := nullif(new.raw_user_meta_data->>'referred_by_code', '');
  if referrer_code is not null then
    select id into referrer_profile_id from public.profiles where referral_code = upper(referrer_code);
  end if;

  insert into public.profiles (id, email, full_name, referral_code, referred_by)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    new_code,
    referrer_profile_id
  );

  if referrer_profile_id is not null then
    insert into public.referrals (referrer_id, referred_id, code)
    values (referrer_profile_id, new.id, upper(referrer_code));
  end if;

  return new;
end;
$$;
