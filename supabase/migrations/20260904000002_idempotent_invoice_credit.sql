-- Le webhook Stripe invoice.paid s'avère systémiquement en échec en prod
-- (3+ paiements réels, un seul reflété dans total_paid_cents, et seulement
-- parce qu'il a été corrigé à la main) -- pas un incident isolé. Plutôt que
-- de continuer à dépendre uniquement du webhook pour le suivi du revenu,
-- on le rend créditable depuis plusieurs endroits (webhook ET filet de
-- secours de /premium/success) sans jamais compter un paiement deux fois :
-- la table ci-dessous sert de registre des factures déjà créditées, avec
-- l'unicité sur invoice_id comme garde-fou.
create table public.stripe_processed_invoices (
  invoice_id text primary key,
  stripe_customer_id text not null,
  amount_cents integer not null,
  created_at timestamptz not null default now()
);

alter table public.stripe_processed_invoices enable row level security;
-- Pas de policy : accès exclusivement service_role.

create or replace function public.credit_invoice_payment(
  p_invoice_id text,
  p_stripe_customer_id text,
  p_amount_cents integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.stripe_processed_invoices (invoice_id, stripe_customer_id, amount_cents)
  values (p_invoice_id, p_stripe_customer_id, p_amount_cents)
  on conflict (invoice_id) do nothing;

  -- FOUND n'est vrai que si l'insert a réellement eu lieu (pas de conflit) :
  -- garantit qu'une facture déjà créditée par un autre appelant (webhook ou
  -- filet de secours) n'incrémente jamais total_paid_cents une seconde fois.
  if found then
    update public.profiles
    set total_paid_cents = total_paid_cents + p_amount_cents
    where stripe_customer_id = p_stripe_customer_id;
  end if;
end;
$$;
