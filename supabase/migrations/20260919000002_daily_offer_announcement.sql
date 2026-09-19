-- Annonce en masse de la nouvelle offre quotidienne (1,50€/jour) à TOUS les
-- inscrits (pas seulement ceux ayant épuisé leurs swipes gratuits, contrairement
-- à weekly_offer_announced_at) -- demande explicite : prévenir tout le monde de
-- ce nouveau palier d'entrée. Colonne d'idempotence (même pattern que
-- weekly_offer_announced_at) : garantit qu'on n'envoie ce mail qu'une seule
-- fois par compte, même si l'action admin est déclenchée plusieurs fois.
alter table public.profiles
  add column if not exists daily_offer_announced_at timestamptz;
