-- Campagne de relance des inactifs (demandée le 28/09, "toute la semaine") :
-- une série de 7 emails espacés d'un jour, uniquement pour les comptes
-- gratuits inactifs déjà inscrits au lancement (voir CAMPAIGN_CUTOFF dans
-- inactive-winback/route.ts, même doctrine que send-swipe-relance).
-- Compteur simple plutôt qu'une date "jour N" : le cron tourne une fois par
-- jour et envoie "le prochain email de la série" à chaque run -- si un run
-- échoue ou est retardé, la série continue au bon endroit au run suivant au
-- lieu de sauter un email ou d'en renvoyer un déjà reçu.
alter table public.profiles
  add column if not exists inactive_campaign_emails_sent integer not null default 0;
