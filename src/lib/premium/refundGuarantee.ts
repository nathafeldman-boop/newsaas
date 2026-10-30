import { createAdminClient } from "@/lib/supabase/admin";
import {
  GUARANTEE_OFFERED_EVENT,
  GUARANTEE_REQUESTED_EVENT,
  guaranteeCoversPurchase,
  guaranteeWindow,
} from "@/lib/premium/guaranteeTerms";

// Côté serveur de la garantie (conditions et constantes dans guaranteeTerms).
const PAID_STATUSES = ["active", "lifetime"];

export type GuaranteeStatus = {
  opensAt: Date;
  closesAt: Date;
  likes: number;
  requestedAt: string | null;
};

// null = pas de garantie sur cet achat (message jamais vu avant l'achat,
// accès offert, rien payé, ou accès à vie acheté à partir du 31/10).
export async function getGuaranteeStatus(
  userId: string,
  profile: { subscription_status: string | null; premium_activated_at: string | null; total_paid_cents: number | null },
): Promise<GuaranteeStatus | null> {
  const activatedAt = profile.premium_activated_at;
  if (!activatedAt || !PAID_STATUSES.includes(profile.subscription_status ?? "") || !(profile.total_paid_cents ?? 0)) {
    return null;
  }
  if (!guaranteeCoversPurchase(profile.subscription_status, activatedAt)) return null;
  const admin = createAdminClient();
  const { data: offered, error: offeredError } = await admin
    .from("user_events")
    .select("id")
    .eq("user_id", userId)
    .eq("event_type", GUARANTEE_OFFERED_EVENT)
    .lte("created_at", activatedAt)
    .limit(1);
  if (offeredError) throw new Error(offeredError.message);
  if (!offered?.length) return null;

  const { opensAt, closesAt } = guaranteeWindow(activatedAt);
  const [{ count: likes, error: likesError }, { data: requested, error: requestedError }] = await Promise.all([
    admin
      .from("swipes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("direction", "like")
      .gte("created_at", activatedAt)
      .lte("created_at", opensAt.toISOString()),
    admin
      .from("user_events")
      .select("created_at")
      .eq("user_id", userId)
      .eq("event_type", GUARANTEE_REQUESTED_EVENT)
      .gte("created_at", activatedAt)
      .limit(1),
  ]);
  if (likesError) throw new Error(likesError.message);
  if (requestedError) throw new Error(requestedError.message);
  return { opensAt, closesAt, likes: likes ?? 0, requestedAt: requested?.[0]?.created_at ?? null };
}
