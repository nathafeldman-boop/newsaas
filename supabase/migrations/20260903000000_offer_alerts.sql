-- Préférence de notification ("Alertes nouvelles offres") + horodatage du
-- dernier envoi, pour le cron de digest (voir /api/cron/notify-new-offers).
-- Activé par défaut : c'est la fonctionnalité qu'on veut mettre en avant,
-- pas un opt-in que personne ne trouve.
alter table public.profiles
  add column if not exists notify_new_offers boolean not null default true,
  add column if not exists last_offer_alert_sent_at timestamptz;
