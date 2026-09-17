import { createAdminClient } from "@/lib/supabase/admin";

export type OnboardingTrustStats = {
  totalUsers: number;
  outcomeCount: number;
  outcomeVariant: "hired" | "interview" | "users";
};

// Chiffres 100% réels, jamais inventés : un chiffre de confiance faux (ex:
// "+40 000 personnes" alors que la base en compte réellement ~1500, voir
// /admin) est une pratique commerciale trompeuse au sens du Code de la
// consommation (art. L121-2), en plus du risque de réputation si un
// visiteur recoupe avec les chiffres publics du dashboard admin. Toujours
// calculé en direct, jamais figé en dur -- grandit tout seul avec la vraie
// croissance du site, sans jamais avoir besoin d'être retouché à la main.
export async function getOnboardingTrustStats(): Promise<OnboardingTrustStats> {
  const admin = createAdminClient();

  const { count: totalUsers, error: usersError } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true });
  if (usersError) console.error("getOnboardingTrustStats: users query failed", usersError);

  // "Personnes ambitieuses qui touchent un revenu grâce à Stageio" =
  // candidature au statut "acceptee" (alternance/stage décroché). Distinct
  // par utilisateur ; bornée par prudence (voir l'audit du 15/09 sur les
  // select non bornés) bien au-delà du volume réel actuel.
  const { data: hiredRows, error: hiredError } = await admin
    .from("applications")
    .select("user_id")
    .eq("status", "acceptee")
    .limit(5000);
  if (hiredError) console.error("getOnboardingTrustStats: hired query failed", hiredError);
  const hiredCount = new Set((hiredRows ?? []).map((r) => r.user_id)).size;

  if (hiredCount > 0) {
    return { totalUsers: totalUsers ?? 0, outcomeCount: hiredCount, outcomeVariant: "hired" };
  }

  // Repli honnête si personne n'a encore de candidature "acceptee" en base
  // (statut posé manuellement ou déduit par classification email -- encore
  // rare) : l'étape juste avant, "en entretien", reste un vrai signal
  // positif tant que le premier cas n'est pas encore arrivé.
  const { data: interviewRows, error: interviewError } = await admin
    .from("applications")
    .select("user_id")
    .eq("status", "entretien")
    .limit(5000);
  if (interviewError) console.error("getOnboardingTrustStats: interview query failed", interviewError);
  const interviewCount = new Set((interviewRows ?? []).map((r) => r.user_id)).size;

  if (interviewCount > 0) {
    return { totalUsers: totalUsers ?? 0, outcomeCount: interviewCount, outcomeVariant: "interview" };
  }

  return { totalUsers: totalUsers ?? 0, outcomeCount: totalUsers ?? 0, outcomeVariant: "users" };
}
