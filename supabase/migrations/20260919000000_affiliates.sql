-- Programme d'affiliation : distinct du parrainage grand public existant
-- (referrals/referred_by, récompense en Premium offert entre potes). Ici,
-- un affilié est un partenaire approuvé à la main par l'admin (vraie
-- commission en argent réel, jamais auto-approuvé) qui touche 50% sur les
-- formules hebdo et mensuelle (jamais la quotidienne, trop fine pour être
-- rentable après commission).

create table public.affiliates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  code text not null unique,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  payout_email text,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create index affiliates_status_idx on public.affiliates (status);

-- Rattache un profil à l'affilié qui l'a apporté -- posé à l'inscription
-- (handle_new_user, comme referred_by) ou via attachAffiliateIfNeeded
-- (retour OAuth). Un seul affilié par profil, jamais réassigné ensuite.
alter table public.profiles add column if not exists affiliate_id uuid references public.affiliates(id);

-- Une ligne par facture Stripe commissionnable (jamais la formule
-- quotidienne) -- invoice_id unique sert d'idempotence exactement comme
-- stripe_processed_invoices : un webhook rejoué ne double jamais une
-- commission déjà posée.
create table public.affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  referred_user_id uuid not null references public.profiles(id) on delete cascade,
  invoice_id text not null unique,
  amount_paid_cents integer not null,
  commission_cents integer not null,
  plan_interval text not null,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index affiliate_commissions_affiliate_idx on public.affiliate_commissions (affiliate_id, status);

alter table public.affiliates enable row level security;
alter table public.affiliate_commissions enable row level security;

-- Un utilisateur voit sa propre candidature/fiche affilié.
create policy "affiliates_select_own" on public.affiliates
  for select using ((select auth.uid()) = user_id);

-- Candidature : un utilisateur ne peut créer que sa propre fiche, et
-- jamais directement au statut "approved" (seul service_role -- l'action
-- admin -- peut approuver).
create policy "affiliates_insert_own" on public.affiliates
  for insert with check ((select auth.uid()) = user_id and status = 'pending');

-- Un affilié voit ses propres commissions (jointure via son user_id).
create policy "affiliate_commissions_select_own" on public.affiliate_commissions
  for select using (
    affiliate_id in (select id from public.affiliates where user_id = (select auth.uid()))
  );

-- Écriture des commissions réservée au webhook Stripe / actions admin
-- (service_role, hors RLS) -- jamais de policy insert/update côté client.

-- handle_new_user : capture aussi le code affilié (raw_user_meta_data ->
-- 'affiliate_code', posé par le formulaire d'inscription comme
-- referred_by_code) -- seul un code au statut "approved" compte, pour ne
-- jamais attribuer une inscription à une candidature encore en attente ou
-- rejetée.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
  referrer_code text;
  referrer_profile_id uuid;
  aff_code text;
  aff_id uuid;
begin
  new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  referrer_code := nullif(new.raw_user_meta_data->>'referred_by_code', '');
  if referrer_code is not null then
    select id into referrer_profile_id from public.profiles where referral_code = upper(referrer_code);
  end if;

  aff_code := nullif(new.raw_user_meta_data->>'affiliate_code', '');
  if aff_code is not null then
    select id into aff_id from public.affiliates where code = upper(aff_code) and status = 'approved';
  end if;

  insert into public.profiles (id, email, full_name, referral_code, referred_by, affiliate_id)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    new_code,
    referrer_profile_id,
    aff_id
  );

  if referrer_profile_id is not null then
    insert into public.referrals (referrer_id, referred_id, code)
    values (referrer_profile_id, new.id, upper(referrer_code));
  end if;

  return new;
end;
$$;
