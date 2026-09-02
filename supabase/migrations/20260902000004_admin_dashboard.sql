-- Dashboard admin : codes d'accès premium, timeline funnel/LTV, compteur de sessions.

alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists premium_activated_at timestamptz,
  add column if not exists total_paid_cents integer not null default 0;

-- CODES D'ACCÈS : débloquent subscription_status='comp' sans passer par Stripe
-- (tests internes / cadeaux), distinct de 'active'/'trialing' pour ne jamais
-- polluer le LTV réel.
create table public.access_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  note text,
  max_uses integer not null default 1,
  use_count integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.access_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.access_codes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  unique (code_id, user_id)
);

-- ÉVÉNEMENTS UTILISATEUR : timeline funnel + compteur de connexions.
-- Écriture ouverte à l'utilisateur pour ses propres événements (ex: login
-- côté client), lecture réservée au service_role (dashboard admin).
create table public.user_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index user_events_user_type_idx on public.user_events (user_id, event_type, created_at desc);

alter table public.access_codes enable row level security;
alter table public.access_code_redemptions enable row level security;
alter table public.user_events enable row level security;

-- Pas de policy select/insert/update pour access_codes / access_code_redemptions :
-- accès exclusivement via service_role (actions admin + rédemption serveur).

create policy "user_events_insert_own" on public.user_events
  for insert with check ((select auth.uid()) = user_id);

-- Incrément atomique du LTV depuis le webhook Stripe (invoice.paid).
create or replace function public.increment_total_paid(p_stripe_customer_id text, p_amount_cents integer)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set total_paid_cents = total_paid_cents + p_amount_cents
  where stripe_customer_id = p_stripe_customer_id;
$$;
