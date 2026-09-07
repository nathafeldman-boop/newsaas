-- Campagne de relance ponctuelle pour tous les inscrits ayant déjà swipé au
-- moins une offre (voir cron send-swipe-relance) -- colonne d'idempotence
-- (même pattern que no_swipe_reminder_sent_at/weekly_offer_announced_at) :
-- garantit qu'un compte ne reçoit ce mail qu'une seule fois, quel que soit
-- le nombre de fois où le cron tourne.
alter table public.profiles
  add column if not exists swipe_relance_sent_at timestamptz;
