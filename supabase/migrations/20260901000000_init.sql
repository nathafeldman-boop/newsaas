-- Alternance/Stage swipe platform — schéma initial

create extension if not exists pgcrypto;

-- ============================================================
-- ENUMS
-- ============================================================
create type contract_type as enum ('alternance', 'stage');
create type gender_type as enum ('homme', 'femme', 'autre', 'non_precise');
create type swipe_direction as enum ('like', 'pass');
create type application_status as enum ('envoyee', 'en_cours', 'entretien', 'acceptee', 'refusee');
create type offer_source as enum ('demo', 'manuel', 'mistral_ingest');

-- ============================================================
-- PROFILES (1-1 avec auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  birth_date date,
  gender gender_type,
  city text,
  bio text,
  skills text[] not null default '{}',
  sectors text[] not null default '{}',
  looking_for contract_type[] not null default '{alternance,stage}',
  cv_path text,
  cv_uploaded_at timestamptz,
  onboarding_completed boolean not null default false,
  referral_code text not null unique,
  referred_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Profil candidat : onboarding, compétences, CV, parrainage.';

create index profiles_referred_by_idx on public.profiles(referred_by);

-- ============================================================
-- OFFERS
-- ============================================================
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null,
  location text not null,
  contract_type contract_type not null,
  sector text,
  description text not null default '',
  requirements text,
  duration text,
  salary text,
  remote_policy text,
  image_url text,
  apply_url text,
  source offer_source not null default 'manuel',
  source_url text,
  external_id text,
  is_active boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (source, external_id)
);

create index offers_active_published_idx on public.offers (is_active, published_at desc);
create index offers_contract_type_idx on public.offers (contract_type);
create index offers_sector_idx on public.offers (sector);

-- ============================================================
-- SWIPES (like / pass)
-- ============================================================
create table public.swipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  offer_id uuid not null references public.offers(id) on delete cascade,
  direction swipe_direction not null,
  created_at timestamptz not null default now(),
  unique (user_id, offer_id)
);

create index swipes_user_direction_idx on public.swipes (user_id, direction);
create index swipes_offer_id_idx on public.swipes (offer_id);

-- ============================================================
-- APPLICATIONS (candidatures)
-- ============================================================
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  offer_id uuid not null references public.offers(id) on delete cascade,
  status application_status not null default 'envoyee',
  cover_note text,
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, offer_id)
);

create index applications_user_idx on public.applications (user_id, applied_at desc);
create index applications_offer_id_idx on public.applications (offer_id);

-- ============================================================
-- REFERRALS (affiliation)
-- ============================================================
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid not null unique references public.profiles(id) on delete cascade,
  code text not null,
  reward_status text not null default 'pending' check (reward_status in ('pending', 'granted')),
  created_at timestamptz not null default now()
);

create index referrals_referrer_idx on public.referrals (referrer_id);

-- ============================================================
-- updated_at helper
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

-- ============================================================
-- Nouveau profil à l'inscription (+ code de parrainage + capture du referrer)
-- ============================================================
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
  -- gen_random_uuid() est intégré au coeur de Postgres (pg_catalog) depuis la
  -- v13 : contrairement à gen_random_bytes() (extension pgcrypto, souvent
  -- installée dans le schéma "extensions" chez Supabase), il reste résolu
  -- quel que soit search_path. Évite un "Database error saving new user"
  -- si pgcrypto n'est pas visible depuis search_path = public.
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
