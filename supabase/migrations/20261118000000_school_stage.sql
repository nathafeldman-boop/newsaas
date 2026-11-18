-- Stages scolaires (18/11, Nathan : « rajoute les stages de 3e, de 2nde, de
-- 1re et pour les bacs pro »). Pas d'offres à importer : Stageio montre les
-- entreprises proches (annuaire public des entreprises) et écrit la lettre,
-- l'élève l'envoie lui-même. Sous 15 ans, un parent doit donner son accord
-- (lien reçu par e-mail) avant que Stageio montre quoi que ce soit.
alter table public.profiles
  add column if not exists school_stage text
    check (school_stage in ('3e', 'seconde', 'premiere', 'bac_pro')),
  add column if not exists parent_email text,
  add column if not exists parent_consent_at timestamptz,
  add column if not exists parent_consent_sent_at timestamptz;

-- Écrites seulement par le serveur (formulaire /stages-scolaires, lien du
-- parent) : un élève ne peut ni se donner l'accord lui-même, ni se vieillir
-- après coup pour ne plus en avoir besoin.
create or replace function public.protect_paid_profile_columns()
returns trigger
language plpgsql
as $function$
begin
  if current_user = 'authenticated' and (
       new.subscription_status is distinct from old.subscription_status
    or new.current_period_end is distinct from old.current_period_end
    or new.stripe_customer_id is distinct from old.stripe_customer_id
    or new.stripe_subscription_id is distinct from old.stripe_subscription_id
    or new.premium_activated_at is distinct from old.premium_activated_at
    or new.total_paid_cents is distinct from old.total_paid_cents
    or new.subscription_price_cents is distinct from old.subscription_price_cents
    or new.subscription_interval is distinct from old.subscription_interval
    or new.premium_tier is distinct from old.premium_tier
    or new.inbox_address is distinct from old.inbox_address
    or new.auto_credits is distinct from old.auto_credits
    or new.auto_pace_free_until is distinct from old.auto_pace_free_until
    or new.school_stage is distinct from old.school_stage
    or new.parent_email is distinct from old.parent_email
    or new.parent_consent_at is distinct from old.parent_consent_at
    or new.parent_consent_sent_at is distinct from old.parent_consent_sent_at
    or (old.school_stage is not null and new.birth_date is distinct from old.birth_date)
  ) then
    raise exception 'Ces informations ne se modifient pas depuis l''appli.' using errcode = '42501';
  end if;
  return new;
end;
$function$;
