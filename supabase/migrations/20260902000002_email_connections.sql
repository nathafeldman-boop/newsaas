-- Connecteur boîte mail (Gmail) : permet de détecter automatiquement les
-- réponses des recruteurs (positif/négatif) et de tenir à jour le statut
-- réel des candidatures (jusqu'ici "envoyee" ne changeait jamais, donc les
-- stats entretien/acceptée/refusée sur /mes-candidatures étaient toujours
-- à zéro).

create type email_provider as enum ('gmail');
create type email_reply_sentiment as enum ('positive', 'negative', 'neutral');

create table public.email_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider email_provider not null default 'gmail',
  email_address text not null,
  refresh_token text not null,
  last_synced_at timestamptz,
  connected_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table public.email_replies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  provider_message_id text not null,
  from_address text,
  subject text,
  snippet text,
  sentiment email_reply_sentiment not null,
  confidence numeric,
  received_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, provider_message_id)
);

create index email_replies_application_idx on public.email_replies (application_id);

alter table public.email_connections enable row level security;
alter table public.email_replies enable row level security;

-- Ces deux tables ne sont JAMAIS interrogées depuis le navigateur (le
-- refresh_token ne doit pas transiter côté client) : uniquement depuis des
-- Server Components / Route Handlers (client serveur, respecte quand même
-- ces policies) et le cron (client service_role, contourne RLS).
create policy "email_connections_select_own" on public.email_connections
  for select using ((select auth.uid()) = user_id);

create policy "email_connections_insert_own" on public.email_connections
  for insert with check ((select auth.uid()) = user_id);

create policy "email_connections_update_own" on public.email_connections
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "email_connections_delete_own" on public.email_connections
  for delete using ((select auth.uid()) = user_id);

create policy "email_replies_select_own" on public.email_replies
  for select using ((select auth.uid()) = user_id);
