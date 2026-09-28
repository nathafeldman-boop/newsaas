-- Nouvelle source : offres importées depuis l'API officielle France Travail
-- (ex-Pôle Emploi, "Offres d'emploi v2", voir /api/cron/sync-france-travail)
-- -- gratuite, volume très supérieur à Adzuna, ajoutée le 28/09 suite à la
-- demande de dépasser 10 000 offres actives. Statement isolé dans sa propre
-- migration comme pour 'adzuna' (20260902000001) : ALTER TYPE ... ADD VALUE
-- ne doit pas partager de transaction avec du DDL qui référence déjà la
-- nouvelle valeur.
alter type offer_source add value if not exists 'france_travail';
