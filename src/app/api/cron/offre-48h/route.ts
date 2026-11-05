import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRowsByIdCursor } from "@/lib/supabase/public";
import { CAMPAIGNS } from "@/lib/campaigns/relanceOffres";
import { sendNextCampaignBatch } from "@/lib/campaigns/sendBatch";
import { CHECKOUT_DAILY_EVENT, SALES_SERIES_EVENT } from "@/lib/campaigns/serieEvents";
import { planOffer48Salve } from "@/lib/campaigns/offre48";
import { HOURLY_SERIES_GUARD_MS } from "@/lib/campaigns/salvesHoraires";

// Salve « offre 48 h » du 5/11 (Nathan : « une autre salve de 400 emails avec
// l'accès à vie à 30 € et l'Auto à 63,23 € »), voir lib/campaigns/offre48.ts.
// vercel.json appelle la route à 5 de chaque heure, de 17 h à 20 h UTC
// (18 h 05 à 21 h 05 à Paris) : le premier passage après la mise en ligne
// envoie les 400 d'un coup, les suivants n'ont plus rien à envoyer.
export const maxDuration = 300;

const DAY_MS = 86_400_000;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const now = Date.now();
  const window = planOffer48Salve(now, 0);
  if (window.kind === "skipped") return NextResponse.json(window);

  // 400 en tout, tous déclencheurs confondus (bouton de l'admin compris).
  // Base illisible : rien n'est envoyé.
  const db = createAdminClient();
  const campaign = CAMPAIGNS.offre48;
  const { count, error } = await db.from("user_events").select("id", { count: "exact", head: true }).eq("event_type", campaign.event);
  if (error || count === null) {
    console.error("offre-48h: base illisible, rien envoyé", error?.message);
    return NextResponse.json({ kind: "skipped", reason: "base_illisible" }, { status: 503 });
  }
  const plan = planOffer48Salve(now, count);
  if (plan.kind === "skipped") return NextResponse.json(plan);

  // À laisser de côté : série Premium ou relance de paiement il y a moins de
  // 3 h, ou un email de salve (dernier appel, nouvelles offres, nouveautés)
  // il y a moins de 24 h.
  let skip: Set<string>;
  try {
    const recent = (events: string[], since: number) =>
      fetchAllRowsByIdCursor<{ id: string; user_id: string }>((afterId, limit) => {
        let q = db.from("user_events").select("id, user_id").in("event_type", events).gte("created_at", new Date(since).toISOString());
        if (afterId) q = q.gt("id", afterId);
        return q.order("id").limit(limit);
      });
    const [series, salves] = await Promise.all([
      recent([SALES_SERIES_EVENT, CHECKOUT_DAILY_EVENT], now - HOURLY_SERIES_GUARD_MS),
      recent([CAMPAIGNS.dernierappel.event, CAMPAIGNS.offres.event, CAMPAIGNS.nouveautes.event], now - DAY_MS),
    ]);
    skip = new Set([...series, ...salves].map((r) => r.user_id));
  } catch (e) {
    console.error("offre-48h: base illisible, rien envoyé", e instanceof Error ? e.message : e);
    return NextResponse.json({ kind: "skipped", reason: "base_illisible" }, { status: 503 });
  }

  const result = await sendNextCampaignBatch(campaign, plan.size, { skip });
  if (result.kind === "sent" && result.failures.length > 0) console.error("offre-48h: problèmes", result.failures.slice(0, 5));
  const summary = result.kind === "sent" ? { ...result, failures: result.failures.length } : result;
  console.log("offre-48h", JSON.stringify(summary));
  return NextResponse.json(summary);
}
