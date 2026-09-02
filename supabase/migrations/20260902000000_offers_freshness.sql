-- Support d'un sourcing à grande échelle (Adzuna) : on doit savoir quand une
-- offre a été vue vivante pour la dernière fois, afin de désactiver celles
-- qui ne réapparaissent plus dans les résultats (probablement pourvues ou
-- retirées) sans attendre le cutoff générique de 45 jours.

alter table public.offers
  add column if not exists last_seen_at timestamptz not null default now();

create index if not exists offers_source_active_idx
  on public.offers (source, is_active, last_seen_at);
