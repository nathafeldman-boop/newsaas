-- Espace créateurs (18/11, Nathan) : chaque créateur s'inscrit avec un lien
-- (nom, téléphone), colle lui-même les liens de ses TikTok, et voit ses vues
-- et ses gains. RPM : carrousel 0,50 € ; vidéo faceless 1 € ; vidéo face
-- 1,50 €. Pour les vidéos, le créateur dit face ou faceless ; Stageio valide
-- la 1re vidéo puis une sur cinq (5e, 10e, 15e…).
-- Service role seulement (RLS sans politique) : le créateur passe par le
-- serveur avec son jeton d'accès, jamais en direct.
create table if not exists public.creators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  tiktok_handle text,
  access_token_hash text not null unique,
  accent text not null default 'violet',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);
alter table public.creators enable row level security;

alter table public.creator_videos
  add column if not exists creator_id uuid references public.creators(id) on delete set null,
  add column if not exists kind text check (kind in ('carousel', 'video')),
  add column if not exists declared_face text check (declared_face in ('face', 'faceless')),
  add column if not exists approved_face text check (approved_face in ('face', 'faceless')),
  add column if not exists review_status text not null default 'none' check (review_status in ('none', 'pending', 'approved', 'corrected')),
  add column if not exists reviewed_at timestamptz,
  add column if not exists video_seq integer;
create index if not exists creator_videos_creator_idx on public.creator_videos (creator_id, added_at desc);
create index if not exists creator_videos_review_idx on public.creator_videos (review_status) where review_status = 'pending';
