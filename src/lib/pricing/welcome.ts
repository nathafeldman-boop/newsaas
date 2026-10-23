import { createAdminClient } from "@/lib/supabase/admin";
import { WELCOME_WINDOW_MS } from "@/lib/pricing/plans";
import { NEWS_CAMPAIGN_EVENT } from "@/lib/campaigns/relanceOffres";
import { SALES_SERIES_EVENT } from "@/lib/campaigns/serieEvents";

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
// de la série Premium (24/10) : le délai repart après chaque email.
export async function getWelcomeEndsAt(userId: string): Promise<number> {
  const admin = createAdminClient();
  const { data: email } = await admin
    .from("user_events")
    .select("created_at")
    .eq("user_id", userId)
    .in("event_type", [NEWS_CAMPAIGN_EVENT, SALES_SERIES_EVENT])
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

// État au moment de l'affichage (hors du corps du composant : rendu pur).
export async function getWelcomeState(userId: string): Promise<{ endsAt: number; active: boolean }> {
  const endsAt = await getWelcomeEndsAt(userId);
  return { endsAt, active: Date.now() < endsAt };
}
