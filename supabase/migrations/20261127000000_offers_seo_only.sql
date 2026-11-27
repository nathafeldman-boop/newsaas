-- Offres importées uniquement pour Google (27/11, Nathan : pages SEO
-- seulement) : CDI/CDD France Travail qui demandent de l'expérience.
-- Indexées (fiche publique + sitemaps dédiés), jamais montrées aux inscrits
-- (fil, emails, compteurs, pages « débutant »).
alter table public.offers add column if not exists seo_only boolean not null default false;

-- Requêtes des inscrits : offres actives hors SEO.
create index if not exists offers_active_feed_idx
  on public.offers (contract_type, published_at desc)
  where is_active and not seo_only;

-- Sitemaps SEO (par tranche d'id) et retrait des offres trop anciennes.
create index if not exists offers_seo_active_idx
  on public.offers (id)
  where is_active and seo_only;
create index if not exists offers_seo_published_idx
  on public.offers (published_at)
  where is_active and seo_only;
