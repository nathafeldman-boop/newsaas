-- Relance "paiement incomplet" : un checkout Stripe qui aboutit à un
-- abonnement en statut 'incomplete' (3D Secure jamais confirmé, carte
-- refusée au premier essai...) ne devient jamais Premium tant que le client
-- ne retente pas -- sans email, la conversion reste juste perdue en
-- silence. Colonne d'idempotence (même pattern que no_swipe_reminder_sent_at
-- / premium_activated_at) : garantit qu'on n'envoie ce mail qu'une fois par
-- compte, que l'envoi vienne du webhook Stripe (automatique, dès que le
-- statut passe à 'incomplete') ou d'un déclenchement manuel admin.
alter table public.profiles
  add column if not exists incomplete_payment_reminder_sent_at timestamptz;
