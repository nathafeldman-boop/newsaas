import { createAdminClient } from "@/lib/supabase/admin";
import { contractOf, inviterFirstName, SIGNED_VIA_STAGEIO } from "@/lib/referrals/share";

// Invitation personnalisée (29/10) : la personne qui arrive avec le lien
// d'un abonné voit qui l'invite (prénom seulement), et s'il a trouvé grâce à
// Stageio. Rien n'est affiché si le code est inconnu ou la base injoignable.
export async function inviterFor(code: string | undefined): Promise<{ firstName: string; signed: boolean; contract: "alternance" | "stage" } | null> {
  const clean = (code ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,40}$/.test(clean)) return null;
  try {
    const { data } = await createAdminClient()
      .from("profiles")
      .select("full_name, search_completed_reason, looking_for")
      .eq("referral_code", clean)
      .maybeSingle();
    const firstName = inviterFirstName(data?.full_name);
    return firstName ? { firstName, signed: data?.search_completed_reason === SIGNED_VIA_STAGEIO, contract: contractOf(data?.looking_for) } : null;
  } catch {
    return null;
  }
}
