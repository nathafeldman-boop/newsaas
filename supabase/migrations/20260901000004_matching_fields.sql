-- Champs supplémentaires pour affiner le matching (spec produit v2).
-- Le genre n'est plus collecté (pas utile au matching) : la colonne existante
-- reste en base pour ne rien casser, mais n'est plus renseignée côté app.

alter table public.profiles
  add column education_level text,
  add column formation text,
  add column target_jobs text[] not null default '{}',
  add column experience_level text,
  add column mobility text,
  add column availability_date date;

alter table public.offers
  add column start_date date,
  add column education_level text;
