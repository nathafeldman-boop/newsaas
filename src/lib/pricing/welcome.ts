import { createAdminClient } from "@/lib/supabase/admin";
import { emailOfferEnd, FLASH_OFFER, isLegacyOffer, offerWindowStart, WELCOME_WINDOW_MS } from "@/lib/pricing/plans";
import { LASTCALL_CAMPAIGN_EVENT, NEWS_CAMPAIGN_EVENT, OFFER48_CAMPAIGN_EVENT } from "@/lib/campaigns/relanceOffres";
import { PRICES_SEEN_EVENT, SALES_SERIES_EVENT } from "@/lib/campaigns/serieEvents";

// Mise en place des nouveaux tarifs : seuls les affichages de la page
// Premium à partir de ce moment ouvrent un prix de bienvenue (chacun a ses
// 10 minutes, même ceux qui avaient déjà vu le paywall avant).
const PRICING_CHANGE_AT = "2026-10-20T10:45:00Z";

// Fin du prix de bienvenue (ms) : WELCOME_WINDOW_MS après le premier affichage de
// /premium (événement paywall_viewed) depuis le changement de tarifs. Aucun
// affichage encore enregistré : le délai commence maintenant.
// Relance email « nouveautés » (Nathan, 23/10 : « remets les offres de
// bienvenue pour ceux qui viendront de l'email ») : pour un destinataire, le
// délai repart de zéro à sa première visite du paywall après l'email, une
// seule fois (il ne reçoit cet email qu'une fois). Même chose à chaque email
// de la série Premium (24/10) : le délai repart après chaque email. Idem
// pour l'email « tu as regardé Premium » du 7/11 (prixVus.ts), qui écrit
// que ses prix tiennent 10 minutes à partir du clic.
export async function getWelcomeEndsAt(userId: string): Promise<number> {
  const admin = createAdminClient();
  const { data: email } = await admin
    .from("user_events")
    .select("created_at")
    .eq("user_id", userId)
    .in("event_type", [NEWS_CAMPAIGN_EVENT, LASTCALL_CAMPAIGN_EVENT, SALES_SERIES_EVENT, OFFER48_CAMPAIGN_EVENT, PRICES_SEEN_EVENT])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const since = email && email.created_at > PRICING_CHANGE_AT ? email.created_at : PRICING_CHANGE_AT;
  const { data } = await admin
    .from("user_events")
    .select("created_at")
    .eq("user_id", userId)
    .eq("event_type", "paywall_viewed")
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const start = data ? Date.parse(data.created_at) : Date.now();
  return start + WELCOME_WINDOW_MS;
}

// Offre par email : fin de l'offre du compte, ou null. Deux sources, la
// plus tardive compte :
// - offre 48 h de la série Premium (28/10-1/11) : 48 h après le premier
//   email qui l'a ouverte ;
// - offre de l'email du 5/11 (EMAIL_OFFER) : 20 minutes à partir de la
//   première visite après l'email (lien valable 48 h).
export async function getFlashEndsAt(userId: string): Promise<number | null> {
  const admin = createAdminClient();
  const first = (q: PromiseLike<{ data: { created_at: string } | null }>) => Promise.resolve(q).then(({ data }) => data?.created_at ?? null);
  const [seriesAt, emailAt] = await Promise.all([
    first(
      admin
        .from("user_events")
        .select("created_at")
        .eq("user_id", userId)
        .eq("event_type", SALES_SERIES_EVENT)
        .eq("metadata->>flash", "true")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ),
    first(
      admin
        .from("user_events")
        .select("created_at")
        .eq("user_id", userId)
        .eq("event_type", OFFER48_CAMPAIGN_EVENT)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ),
  ]);
  const now = Date.now();
  // Première visite de la page Premium (ou du lien de paiement) après l'email.
  const firstViewAt = emailAt
    ? await first(
        admin
          .from("user_events")
          .select("created_at")
          .eq("user_id", userId)
          .eq("event_type", "paywall_viewed")
          .gte("created_at", emailAt)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
      )
    : null;
  const ends = [seriesAt ? Date.parse(seriesAt) + FLASH_OFFER.windowMs : null, emailOfferEnd(emailAt, firstViewAt, now)].filter(
    (t): t is number => t !== null,
  );
  return ends.length > 0 ? Math.max(...ends) : null;
}

// État au moment de l'affichage (hors du corps du composant : rendu pur).
// Pendant l'offre 48 h, le prix de bienvenue dure jusqu'à la fin de l'offre.
// legacy : offre ouverte avant le test de prix du 29/10, tenue à 7,99 €/mois.
export async function getWelcomeState(userId: string): Promise<{ endsAt: number; active: boolean; flashEndsAt: number | null; legacy: boolean }> {
  const [welcomeEndsAt, flash] = await Promise.all([getWelcomeEndsAt(userId), getFlashEndsAt(userId)]);
  const now = Date.now();
  const flashEndsAt = flash !== null && now < flash ? flash : null;
  const endsAt = Math.max(welcomeEndsAt, flashEndsAt ?? 0);
  return { endsAt, active: now < endsAt, flashEndsAt, legacy: isLegacyOffer(offerWindowStart(welcomeEndsAt, flashEndsAt, now)) };
}
