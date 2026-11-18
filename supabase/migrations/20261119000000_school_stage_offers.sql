-- Stages scolaires payants (18/11, Nathan : « l'onboarding de base, sauf
-- qu'au lieu des offres d'alternance, ça leur donnera des offres de stage de
-- 3e… et on va les faire payer »).
-- - stage_scolaire : type à part, jamais montré aux autres profils ni sur
--   les pages publiques (qui filtrent par alternance / stage / CDI / CDD).
-- - 1eleve1stage : vraies offres de 3e et de seconde de la plateforme de
--   l'État (licence Etalab 2.0, source citée sur chaque offre).
-- - annuaire_entreprises : entreprises proches sans offre publiée, montrées
--   comme « candidature spontanée » (1re, bac pro, et en complément).
-- - school_levels : classes concernées ('3e', 'seconde', 'premiere', 'bac_pro').
alter type contract_type add value if not exists 'stage_scolaire';
alter type offer_source add value if not exists '1eleve1stage';
alter type offer_source add value if not exists 'annuaire_entreprises';

alter table public.offers add column if not exists school_levels text[];
create index if not exists offers_school_levels_idx on public.offers using gin (school_levels) where school_levels is not null;
