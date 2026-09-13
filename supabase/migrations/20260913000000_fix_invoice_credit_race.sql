-- Bug racine derriere les paiements reels jamais reflates dans total_paid_cents
-- (LTV), corrige a la main a chaque fois jusqu'ici (voir fixMissingLtvAction) :
-- credit_invoice_payment (migration 20260904000002) inserait TOUJOURS la
-- facture dans le registre stripe_processed_invoices des le premier appel,
-- puis ne creditait le profil QUE SI cet insert avait reussi (FOUND) --
-- mais sans jamais verifier que l'UPDATE qui suit ait reellement matche une
-- ligne. Stripe ne garantit pas l'ordre de livraison des webhooks : quand
-- "invoice.paid" arrive avant que "checkout.session.completed" n'ait fini de
-- poser stripe_customer_id sur le profil (deux requetes HTTP independantes,
-- potentiellement traitees en parallele), l'UPDATE ne matche aucune ligne --
-- mais la facture est deja marquee "traitee" dans le registre. Toute
-- nouvelle tentative (rejeu du webhook, filet de secours /premium/success)
-- voit alors la facture comme deja creditee et ne fait plus rien : le
-- paiement reste invisible pour toujours, sans aucune erreur remontee nulle
-- part.
--
-- Corrige en inversant l'ordre : on tente d'abord le credit reel (UPDATE),
-- et on ne marque la facture comme traitee dans le registre que si l'UPDATE
-- a effectivement matche au moins une ligne. Un verrou consultatif par
-- invoice_id remplace la contrainte d'unicite comme garde-fou contre le
-- double credit (deux appels concurrents pour la meme facture, ex: webhook
-- + filet de secours arrivant en meme temps) : le second appel attend que le
-- premier ait fini, puis voit la facture deja dans le registre et s'arrete
-- la. Retourne desormais un booleen (true = credite, false = pas encore
-- possible, a reessayer plus tard) plutot que rien -- l'appelant (webhook)
-- s'en sert pour renvoyer une erreur a Stripe et declencher son retry
-- automatique au lieu de repondre 200 sur un credit qui n'a pas eu lieu.
create or replace function public.credit_invoice_payment(
  p_invoice_id text,
  p_stripe_customer_id text,
  p_amount_cents integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated_rows integer;
begin
  perform pg_advisory_xact_lock(hashtext(p_invoice_id));

  if exists (select 1 from public.stripe_processed_invoices where invoice_id = p_invoice_id) then
    return true;
  end if;

  update public.profiles
  set total_paid_cents = total_paid_cents + p_amount_cents
  where stripe_customer_id = p_stripe_customer_id;
  get diagnostics v_updated_rows = row_count;

  if v_updated_rows = 0 then
    return false;
  end if;

  insert into public.stripe_processed_invoices (invoice_id, stripe_customer_id, amount_cents)
  values (p_invoice_id, p_stripe_customer_id, p_amount_cents)
  on conflict (invoice_id) do nothing;

  return true;
end;
$$;
