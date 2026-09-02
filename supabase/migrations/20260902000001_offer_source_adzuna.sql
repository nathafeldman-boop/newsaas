-- Nouvelle source : offres importées en masse depuis l'API Adzuna (sync
-- périodique, voir /api/cron/sync-adzuna). Statement isolé dans sa propre
-- migration car ALTER TYPE ... ADD VALUE ne doit pas partager de
-- transaction avec du DDL qui référence déjà la nouvelle valeur.
alter type offer_source add value if not exists 'adzuna';
