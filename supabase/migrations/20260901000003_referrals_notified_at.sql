-- Empêche l'envoi en double de l'email de notification au parrain
alter table public.referrals add column notified_at timestamptz;
