-- Présence "en ligne" pour le dashboard admin : mis à jour à chaque
-- navigation authentifiée dans l'appli (voir (app)/layout.tsx), pas
-- seulement au login -- sinon un compte resterait compté "en ligne"
-- des heures après avoir fermé l'onglet.
alter table public.profiles
  add column if not exists last_active_at timestamptz;

create index if not exists profiles_last_active_at_idx on public.profiles (last_active_at);
