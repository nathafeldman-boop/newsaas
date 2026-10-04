-- Flag "envoyé une fois pour toutes" pour la relance panier abandonné
-- (checkout Stripe commencé -- stripe_customer_id posé -- jamais terminé),
-- même doctrine que incomplete_payment_reminder_sent_at /
-- swipe_relance_sent_at : évite de renvoyer le même mail à chaque fois que
-- l'admin relance la campagne.
alter table profiles
  add column if not exists checkout_abandoned_reminder_sent_at timestamptz;
