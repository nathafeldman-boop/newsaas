-- Relance "tu n'as pas encore swipé" : évalué une seule fois par compte
-- (envoyé ou non), jamais en rappel récurrent -- voir
-- src/app/api/cron/notify-no-swipe/route.ts.
alter table public.profiles
  add column if not exists no_swipe_reminder_sent_at timestamptz;
