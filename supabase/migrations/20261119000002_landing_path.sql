-- Page d'arrivée de chaque inscrit (18/11, Nathan : « convertir un maximum
-- depuis Google ») : première page ouverte sur le site (cookie posé par
-- proxy.ts), recopiée sur le profil à l'arrivée dans l'onboarding. Sert à
-- savoir quelles pages font s'inscrire (accueil, fiche offre, ville…).
alter table public.profiles add column if not exists landing_path text;
