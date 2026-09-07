-- Pour calculer un ARR (revenu récurrent annualisé) fiable sur le dashboard
-- admin, il faut savoir quel prix/quelle cadence chaque abonné actif paie
-- réellement (mensuel à 7,99€ vs hebdo à 3,50€ depuis l'ajout de l'offre
-- hebdomadaire) -- rien en base ne le distingue aujourd'hui. Alimenté
-- directement depuis Stripe (subscription.items.data[0].price) dans
-- syncSubscriptionToProfile, donc toujours exact même si les prix
-- changent plus tard, sans dupliquer de constante de prix côté app.
alter table public.profiles
  add column if not exists subscription_price_cents integer,
  add column if not exists subscription_interval text;
