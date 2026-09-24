-- Retention/quality pass (audit RETENTION_AUDIT.md) :
--  - déduplication cross-source (fingerprint) + qualité des offres, pour
--    filtrer le feed sans dépendre uniquement de is_active/published_at
--  - clôture de recherche ("j'ai trouvé mon alternance") sans perdre les
--    données existantes
--  - feedback court à l'annulation d'abonnement
--  - historique de conversation Jimmy (copilote IA)
-- Purement additif : aucune colonne existante modifiée/supprimée, tous les
-- nouveaux champs sont nullable ou ont un défaut sûr pour les lignes
-- existantes.

alter table public.offers
  add column if not exists content_fingerprint text,
  add column if not exists quality_score smallint not null default 50;

-- Utilisé pour repérer les doublons cross-source (une même offre publiée à
-- la fois sur Adzuna et retrouvée par la découverte Mistral, ou republiée
-- sous un external_id différent) : deux offres actives avec la même
-- empreinte sont regroupées par un job de nettoyage (voir
-- src/lib/offers/dedupe.ts, appelé depuis deactivate-expired-offers), pas
-- une contrainte unique stricte -- une offre légitimement republiée des mois
-- plus tard après expiration ne doit jamais être bloquée à l'insertion.
create index if not exists offers_fingerprint_active_idx
  on public.offers (content_fingerprint)
  where is_active = true and content_fingerprint is not null;

-- Remplace published_at seul comme critère principal du pool de candidats
-- côté /swipe : une offre récente mais vide (pas de description, pas de
-- prérequis, pas de salaire...) ne doit plus passer devant une offre un peu
-- plus ancienne mais complète.
create index if not exists offers_quality_active_idx
  on public.offers (is_active, quality_score desc, published_at desc);

-- "J'ai trouvé mon alternance" (section 17E de l'audit) : clôturer la
-- recherche sans supprimer aucune donnée ni forcer une désinscription. Tant
-- que search_completed_at est renseigné, /swipe affiche un état de
-- félicitations plutôt que le deck, et les crons de relance (notify-new-
-- offers, notify-no-swipe, send-swipe-relance) excluent ce profil. Nullable,
-- donc aucun effet sur les comptes existants.
alter table public.profiles
  add column if not exists search_completed_at timestamptz,
  add column if not exists search_completed_reason text;

-- Feedback court au moment de l'annulation (section 20) : jamais bloquant,
-- l'utilisateur atteint toujours le vrai portail Stripe qu'il réponde ou
-- non (voir /premium/annuler). Sert à comprendre le churn sans jamais
-- présumer une causalité à partir d'une simple corrélation.
create table if not exists public.subscription_cancellations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  detail text,
  created_at timestamptz not null default now()
);

alter table public.subscription_cancellations enable row level security;

create policy subscription_cancellations_insert_own
  on public.subscription_cancellations for insert
  with check (auth.uid() = user_id);

-- Pas de policy select pour l'utilisateur (feedback anonymisé côté produit,
-- lu uniquement par l'admin via service_role) -- même choix que user_events.
create index if not exists subscription_cancellations_reason_idx
  on public.subscription_cancellations (reason, created_at desc);

-- Historique de conversation Jimmy (copilote IA, section 8). Conservé (pas
-- ephemeral côté client uniquement) pour que Jimmy garde le contexte d'une
-- session à l'autre -- capé côté application (voir trimJimmyHistory dans
-- src/app/(app)/jimmy/actions.ts) pour ne pas grossir indéfiniment.
create table if not exists public.jimmy_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.jimmy_messages enable row level security;

create policy jimmy_messages_select_own
  on public.jimmy_messages for select
  using (auth.uid() = user_id);

create policy jimmy_messages_insert_own
  on public.jimmy_messages for insert
  with check (auth.uid() = user_id);

create index if not exists jimmy_messages_user_created_idx
  on public.jimmy_messages (user_id, created_at desc);
