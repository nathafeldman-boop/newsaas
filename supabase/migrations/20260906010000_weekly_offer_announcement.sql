-- Annonce en masse de la nouvelle offre hebdomadaire (3,50€/semaine) aux
-- inscrits déjà passés par le mur payant sans avoir pris Premium. Colonne
-- d'idempotence (même pattern que incomplete_payment_reminder_sent_at) :
-- garantit qu'on n'envoie ce mail qu'une seule fois par compte, même si
-- l'action admin est déclenchée plusieurs fois.
alter table public.profiles
  add column if not exists weekly_offer_announced_at timestamptz;
