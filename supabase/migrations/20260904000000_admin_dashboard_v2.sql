-- Dashboard admin v2 : visites (pour "visiteurs distincts par jour de semaine"
-- et une future liste "en ligne maintenant" plus riche) + avis utilisateurs.

-- VISITES : un id anonyme (cookie posé par proxy.ts) par ligne, écrit
-- exclusivement par le service_role (voir src/lib/analytics/logVisit.ts) --
-- jamais de policy d'insert publique, pas besoin puisque le service_role
-- bypass RLS. Pas de user_id : le but ici est de compter les visiteurs
-- distincts (connectés ou non), pas de relier chaque visite à un compte.
create table public.site_visits (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  path text not null,
  created_at timestamptz not null default now()
);

create index site_visits_created_at_idx on public.site_visits (created_at);
create index site_visits_visitor_created_idx on public.site_visits (visitor_id, created_at);

alter table public.site_visits enable row level security;
-- Pas de policy : accès exclusivement service_role (même pattern que
-- access_codes / access_code_redemptions).

-- AVIS : note 1-5 + commentaire optionnel, modérés avant tout affichage
-- public éventuel. Un avis par utilisateur (upsert côté action serveur).
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  unique (user_id)
);

create index reviews_status_idx on public.reviews (status, created_at desc);

alter table public.reviews enable row level security;

create policy "reviews_insert_own" on public.reviews
  for insert with check ((select auth.uid()) = user_id);

create policy "reviews_update_own" on public.reviews
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "reviews_select_own" on public.reviews
  for select using ((select auth.uid()) = user_id);
