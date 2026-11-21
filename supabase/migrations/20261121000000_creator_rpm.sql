-- RPM des créateurs réglable par Nathan (21/11 : « j'aimerais fixer le RPM
-- de mes créateurs moi-même ») : tarifs par défaut (une seule ligne) et, si
-- besoin, un tarif propre à un créateur (vide = tarif par défaut).
-- Euros pour 1 000 vues. Service role seulement (RLS sans politique).
create table if not exists public.creator_rpm (
  id smallint primary key default 1 check (id = 1),
  carousel numeric(6,2) not null default 0.50 check (carousel >= 0),
  faceless numeric(6,2) not null default 1.00 check (faceless >= 0),
  face numeric(6,2) not null default 1.50 check (face >= 0),
  updated_at timestamptz not null default now()
);
alter table public.creator_rpm enable row level security;
insert into public.creator_rpm (id) values (1) on conflict (id) do nothing;

alter table public.creators
  add column if not exists rpm_carousel numeric(6,2) check (rpm_carousel >= 0),
  add column if not exists rpm_faceless numeric(6,2) check (rpm_faceless >= 0),
  add column if not exists rpm_face numeric(6,2) check (rpm_face >= 0);
