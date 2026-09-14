-- "profiles" a dépassé 1000 lignes (1252 au moment où ce bug a été trouvé) --
-- le "Max Rows" par défaut de l'API Supabase (réglage projet, souvent 1000)
-- tronque silencieusement tout SELECT non borné sur cette table aux ~1000
-- premières lignes renvoyées. Deux endroits sommaient total_paid_cents en
-- récupérant TOUTES les lignes côté application puis en réduisant en JS
-- (revenu cumulé sur /admin, et la reconciliation LTV/Stripe) : la somme
-- réelle était donc fausse dès que la table a dépassé ce seuil, sans aucune
-- erreur remontée (les deux requêtes réussissaient, juste avec moins de
-- lignes que prévu) -- symptôme observé : la reconciliation LTV/Stripe a
-- rapporté un montant "récupéré" négatif, mathématiquement impossible
-- puisque cette fonction n'additionne jamais que des montants positifs.
--
-- Fonction d'agrégation côté base : ne retourne qu'un scalaire, jamais
-- soumise à cette limite quelle que soit la taille de la table.
create or replace function public.sum_total_paid_cents()
returns bigint
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(sum(total_paid_cents), 0) from public.profiles;
$$;
