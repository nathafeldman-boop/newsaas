-- Historique des publications LinkedIn préparées depuis /admin/linkedin (1/11/2026).
-- Une publication enregistrée bloque ses offres 60 jours (voir src/lib/linkedin/data.ts).
-- Lecture et écriture par le rôle service seulement : RLS activée, aucune politique.
create table if not exists public.linkedin_posts (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), kind text not null, label text not null, body text not null, comment text, offer_ids uuid[] not null default array[]::uuid[], published boolean not null default false, published_at timestamptz, linkedin_url text);
alter table public.linkedin_posts enable row level security;
