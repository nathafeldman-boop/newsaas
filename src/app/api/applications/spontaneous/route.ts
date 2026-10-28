import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPremium } from "@/lib/subscription/isPremium";
import { parisMidnightIso } from "@/lib/applications/autoSend";
import { SPONTANEOUS_DAILY_LIMIT, contactedBy, loadTargets } from "@/lib/spontaneous/targets";
import { sendSpontaneous, type SpontaneousSendResult } from "@/lib/spontaneous/send";

// Bouton « Envoyer ma candidature » de /spontanees (28/10) : abonnés
// seulement, une entreprise de SA liste (jamais un identifiant venu d'ailleurs),
// une seule fois, 30 par jour au plus. Route plutôt que server action : il
// peut enchaîner les envois sans attendre le précédent.
export const maxDuration = 60;

type Result = SpontaneousSendResult | { status: "already_sent" | "daily_limit" | "not_found" | "premium_required"; company?: string };

function json(result: Result, status = 200) {
  console.log(`spontanees: ${result.status}`);
  return NextResponse.json(result, { status });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { recipientId?: unknown } | null;
  const recipientId = typeof body?.recipientId === "string" ? body.recipientId : null;
  if (!recipientId) return json({ status: "error" }, 400);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ status: "error" }, 401);

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile || !isPremium(profile)) return json({ status: "premium_required" });

  const admin = createAdminClient();
  const [targets, contacted] = await Promise.all([loadTargets(profile), contactedBy(admin, user.id, parisMidnightIso(Date.now()))]);
  if (targets.status !== "ok") return json({ status: targets.status === "off" ? "off" : "error" });
  const target = targets.targets.find((t) => t.recipientId === recipientId);
  if (!target) return json({ status: "not_found" });
  if (contacted.ids.has(recipientId)) return json({ status: "already_sent", company: target.company });
  if (contacted.manual >= SPONTANEOUS_DAILY_LIMIT) return json({ status: "daily_limit", company: target.company });

  return json(await sendSpontaneous(admin, { ...profile, email: profile.email ?? user.email ?? null }, target, "manual"));
}
