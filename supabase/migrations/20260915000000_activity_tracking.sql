-- Suivi complet du funnel demandé côté admin : "sur quelle page il est là
-- maintenant" + "sur quel bouton il a cliqué". La présence "en ligne" (voir
-- migration 20260902000004 / 20260903000003) donnait déjà last_active_at,
-- mais jamais la page -- ajoutée ici, posée par (app)/layout.tsx au même
-- endroit et au même moment que last_active_at (chaque navigation
-- authentifiée), donc sans coût supplémentaire.
alter table public.profiles add column if not exists last_active_path text;

-- Les clics de bouton utilisent déjà la table user_events existante
-- (event_type='button_click', metadata jsonb avec {button, path, ...}) --
-- pas de nouvelle table nécessaire, RLS déjà en place (insert par soi-même,
-- lecture service_role uniquement pour l'admin).
