-- Cache du texte brut extrait du CV, posé une fois à l'upload (voir
-- cacheCvTextAction) plutôt que re-téléchargé/re-parsé à chaque chargement
-- de /swipe -- sert de signal de matching supplémentaire réservé aux
-- utilisateurs Premium (voir computeCvMatchBonus dans
-- src/lib/matching/score.ts), qui va chercher dans le contenu réel du CV
-- au-delà des champs figés de l'onboarding.
alter table public.profiles
  add column if not exists cv_text text;
