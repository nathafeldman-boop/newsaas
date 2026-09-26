-- Hard paywall (décision produit du 26/09, voir RETENTION_AUDIT.md) : plus
-- d'essai gratuit du tout. Un compte gratuit peut parcourir le deck sans
-- aucune limite (le "pass" ne coûte plus rien et n'est plus plafonné), mais
-- ne peut plus RIEN faire d'autre : ni liker (= mettre en favori, "like" et
-- "favori" sont la même table côté swipes), ni candidater. Remplace le
-- quota hebdomadaire (3/semaine, voir 20260903000002_swipe_quota_three.sql)
-- par un blocage pur sur l'action, pas sur le volume de navigation.

create or replace function public.enforce_swipe_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  -- "pass" = pure navigation, jamais plafonné, même pour un compte gratuit :
  -- c'est précisément ce que le hard paywall doit laisser faire ("ils
  -- peuvent voir les cartes").
  if new.direction <> 'like' then
    return new;
  end if;

  select subscription_status into v_status
  from public.profiles
  where id = new.user_id;

  if v_status in ('active', 'trialing', 'comp') then
    return new;
  end if;

  -- Idempotence de l'upsert (onConflict user_id,offer_id) : un like déjà
  -- enregistré avant le passage au hard paywall (ou pendant que l'utilisateur
  -- était Premium) reste modifiable par lui-même, on ne retire jamais un
  -- favori déjà acquis.
  if exists(
    select 1 from public.swipes
    where user_id = new.user_id and offer_id = new.offer_id
  ) then
    return new;
  end if;

  raise exception 'PREMIUM_REQUIRED'
    using errcode = 'P0001',
          hint = 'Liker une offre (= la mettre en favori) est réservé aux comptes Premium.';
end;
$$;

-- Même logique pour candidater : jusqu'ici explicitement illimité même sans
-- Premium (voir l'ancien commentaire de generateCoverLetterAction) --
-- désormais réservé aux Premium comme le reste des actions. Ceinture et
-- bretelles avec le check déjà ajouté côté Server Action (defense in depth :
-- applications_insert_own autorise déjà n'importe quel insert de
-- l'utilisateur propriétaire côté RLS, donc sans ce trigger un appel direct
-- au SDK Supabase depuis le client contournerait le check applicatif).
create or replace function public.enforce_premium_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  select subscription_status into v_status
  from public.profiles
  where id = new.user_id;

  if v_status in ('active', 'trialing', 'comp') then
    return new;
  end if;

  raise exception 'PREMIUM_REQUIRED'
    using errcode = 'P0001',
          hint = 'Candidater est réservé aux comptes Premium.';
end;
$$;

drop trigger if exists applications_enforce_premium on public.applications;
create trigger applications_enforce_premium
  before insert on public.applications
  for each row execute function public.enforce_premium_application();
