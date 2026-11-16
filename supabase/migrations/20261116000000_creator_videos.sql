-- Vidéos TikTok des créateurs suivies depuis la vue d'ensemble admin (16/11/2026).
-- Le cron /api/cron/tiktok-views relève les vues toutes les 3 h ; chaque relevé
-- est gardé dans creator_video_views pour calculer les vues gagnées sur une
-- période (et donc le RPM). Service role seulement : RLS activée, aucune politique.
create table if not exists public.creator_videos (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  creator text,
  added_at timestamptz not null default now(),
  views bigint,
  checked_at timestamptz,
  last_error text
);
alter table public.creator_videos enable row level security;

create table if not exists public.creator_video_views (
  video_id uuid not null references public.creator_videos(id) on delete cascade,
  checked_at timestamptz not null default now(),
  views bigint not null check (views >= 0),
  primary key (video_id, checked_at)
);
alter table public.creator_video_views enable row level security;
