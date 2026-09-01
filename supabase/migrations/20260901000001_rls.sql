-- Row Level Security
-- (select auth.uid()) plutôt que auth.uid() nu : évalué une fois par requête
-- au lieu d'une fois par ligne — cf. security-rls-performance.

alter table public.profiles enable row level security;
alter table public.offers enable row level security;
alter table public.swipes enable row level security;
alter table public.applications enable row level security;
alter table public.referrals enable row level security;

-- PROFILES : chacun lit/modifie uniquement sa propre fiche
create policy "profiles_select_own" on public.profiles
  for select using ((select auth.uid()) = id);

create policy "profiles_update_own" on public.profiles
  for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- l'insertion se fait via le trigger handle_new_user (security definer) ; pas d'insert direct côté client

-- OFFERS : lecture publique des offres actives, écriture réservée au service_role (ingestion)
create policy "offers_select_active" on public.offers
  for select using (is_active = true);

-- SWIPES : un utilisateur ne voit / ne crée / ne modifie que ses propres swipes
create policy "swipes_select_own" on public.swipes
  for select using ((select auth.uid()) = user_id);

create policy "swipes_insert_own" on public.swipes
  for insert with check ((select auth.uid()) = user_id);

create policy "swipes_update_own" on public.swipes
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "swipes_delete_own" on public.swipes
  for delete using ((select auth.uid()) = user_id);

-- APPLICATIONS : idem, strictement propriétaire
create policy "applications_select_own" on public.applications
  for select using ((select auth.uid()) = user_id);

create policy "applications_insert_own" on public.applications
  for insert with check ((select auth.uid()) = user_id);

create policy "applications_update_own" on public.applications
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- REFERRALS : un parrain voit les filleuls qu'il a apportés
create policy "referrals_select_as_referrer" on public.referrals
  for select using ((select auth.uid()) = referrer_id);

-- ============================================================
-- STORAGE : bucket privé pour les CV, un dossier par utilisateur
-- ============================================================
insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do nothing;

create policy "cv_upload_own_folder" on storage.objects
  for insert with check (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "cv_read_own_folder" on storage.objects
  for select using (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "cv_update_own_folder" on storage.objects
  for update using (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "cv_delete_own_folder" on storage.objects
  for delete using (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
