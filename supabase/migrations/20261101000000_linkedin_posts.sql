-- Publications LinkedIn préparées depuis /admin/linkedin (01/11, Nathan :
-- « transformer LinkedIn en canal d'acquisition régulier »). Rien n'est
-- publié automatiquement : l'admin génère un brouillon, le relit, le copie
-- sur LinkedIn, puis le marque « publié ». La table sert d'historique et
-- d'anti-doublon : une offre déjà présente dans un post publié n'est plus
-- reproposée (offer_ids + index GIN).
--
-- Lecture/écriture uniquement côté serveur avec le rôle service (espace
-- admin) : RLS activée sans aucune policy = aucun accès anon/authenticated.

create table if not exists public.linkedin_posts (
  id uuid primary key default gen_random_uuid(),
  -- 'jour' | 'secteur' | 'ville' | 'hebdo'
  format text not null check (format in ('jour', 'secteur', 'ville', 'hebdo')),
  -- Clé du secteur ou de la ville (null pour jour/hebdo).
  segment text,
  -- Offres retenues, dans l'ordre du post.
  offer_ids uuid[] not null default '{}',
  -- Instantané des champs publiés (titre, entreprise, ville, lien) au moment
  -- de la génération : l'historique reste lisible même si l'offre expire.
  offers_snapshot jsonb not null default '[]'::jsonb,
  body text not null,
  first_comment text,
  status text not null default 'brouillon' check (status in ('brouillon', 'publie', 'abandonne')),
  utm_campaign text not null,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists linkedin_posts_created_at_idx on public.linkedin_posts (created_at desc);
create index if not exists linkedin_posts_offer_ids_idx on public.linkedin_posts using gin (offer_ids);

alter table public.linkedin_posts enable row level security;
