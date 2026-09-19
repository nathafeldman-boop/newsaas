-- Suivi des clics sur un lien d'affiliation, avant même l'inscription : le
-- dashboard affilié ne montrait jusqu'ici que les inscrits et les
-- commissions, aucune visibilité sur l'entonnoir clic -> inscription ->
-- paiement -- important pour un affilié qui met son lien en bio et veut
-- savoir si le trafic existe avant de se demander pourquoi personne ne
-- convertit. Écrit uniquement côté serveur (proxy.ts, service_role) : pas
-- de policy insert côté client nécessaire.
create table public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  visitor_id text not null,
  created_at timestamptz not null default now()
);

create index affiliate_clicks_affiliate_idx on public.affiliate_clicks (affiliate_id, created_at desc);

alter table public.affiliate_clicks enable row level security;

create policy "affiliate_clicks_select_own" on public.affiliate_clicks
  for select using (
    affiliate_id in (select id from public.affiliates where user_id = (select auth.uid()))
  );
