import { createAdminClient } from "@/lib/supabase/admin";
import { BOT_UA_PATTERN } from "@/lib/analytics/logVisit";

// Appelé depuis proxy.ts (event.waitUntil, jamais bloquant pour la
// réponse réelle) dès qu'un ?aff=CODE apparaît dans l'URL -- avant même que
// la personne ait un compte, donc pas de user_id disponible : on réutilise
// le même cookie visiteur anonyme que site_visits plutôt que d'inventer un
// second mécanisme de tracking.
export async function logAffiliateClick(
  visitorId: string,
  affCode: string,
  userAgent: string | null,
): Promise<void> {
  if (userAgent && BOT_UA_PATTERN.test(userAgent)) return;

  try {
    const admin = createAdminClient();
    const { data: affiliate, error: lookupError } = await admin
      .from("affiliates")
      .select("id")
      .eq("code", affCode.toUpperCase())
      .eq("status", "approved")
      .maybeSingle();
    if (lookupError) {
      console.error("logAffiliateClick: lookup failed", lookupError, { affCode });
      return;
    }
    // Code inconnu, pas encore approuvé, ou simple faute de frappe dans
    // l'URL : rien à logger, jamais une erreur en soi.
    if (!affiliate) return;

    const { error } = await admin
      .from("affiliate_clicks")
      .insert({ affiliate_id: affiliate.id, visitor_id: visitorId });
    if (error) {
      console.error("logAffiliateClick: insert failed", error, { affCode });
    }
  } catch (err) {
    console.error("logAffiliateClick threw", err, { affCode });
  }
}
