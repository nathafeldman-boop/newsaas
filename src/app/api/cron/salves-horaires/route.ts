import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRowsByIdCursor } from "@/lib/supabase/public";
import { CAMPAIGNS } from "@/lib/campaigns/relanceOffres";
import { sendNextCampaignBatch, type BatchResult } from "@/lib/campaigns/sendBatch";
import { CHECKOUT_DAILY_EVENT, SALES_SERIES_EVENT } from "@/lib/campaigns/serieEvents";
import { FLASH_OFFER } from "@/lib/pricing/plans";
import {
  HOURLY_SALVE_GAP_MS,
  HOURLY_SALVE_QUEUE,
  HOURLY_SERIES_GUARD_MS,
  planHourlySalve,
} from "@/lib/campaigns/salvesHoraires";

// Salves horaires (Nathan, 5/11 : « 100 par heure à partir de 15h »), voir
// lib/campaigns/salvesHoraires.ts. vercel.json appelle la route toutes les
// heures de 13 h à 20 h UTC ; seuls les passages de 15 h à 21 h à Paris
// envoient (13 h UTC ne sert qu'à l'heure d'été).
export const maxDuration = 300;

const SALVE_EVENTS = HOURLY_SALVE_QUEUE.map((id) => CAMPAIGNS[id].event);
const DAY_MS = 86_400_000;

type Db = ReturnType<typeof createAdminClient>;

// Comptes qui ont reçu un de ces emails depuis `sinceMs`.
async function recentRecipients(db: Db, events: string[], since: number): Promise<string[]> {
  const rows = await fetchAllRowsByIdCursor<{ id: string; user_id: string }>((afterId, limit) => {
    let q = db.from("user_events").select("id, user_id").in("event_type", events).gte("created_at", new Date(since).toISOString());
    if (afterId) q = q.gt("id", afterId);
    return q.order("id").limit(limit);
  });
  return rows.map((r) => r.user_id);
}

// À laisser pour un prochain passage : série Premium ou relance de paiement
// reçue il y a moins de 3 h, ou un email de salve (ou de relance) il y a
// moins de 24 h, ou l'offre 48 h du 5/11 pas encore finie (sinon un « Dernier
// appel » à 40 € arriverait en pleine offre à 30 €). Relu avant chaque
// campagne : les comptes notés par la campagne précédente du même passage en
// font partie.
async function skipList(db: Db, now: number): Promise<Set<string>> {
  const [series, salves, offer48] = await Promise.all([
    recentRecipients(db, [SALES_SERIES_EVENT, CHECKOUT_DAILY_EVENT], now - HOURLY_SERIES_GUARD_MS),
    recentRecipients(db, [...SALVE_EVENTS, CAMPAIGNS.nouveautes.event], now - DAY_MS),
    recentRecipients(db, [CAMPAIGNS.offre48.event], now - FLASH_OFFER.windowMs),
  ]);
  return new Set([...series, ...salves, ...offer48]);
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const now = Date.now();
  // Hors fenêtre : rien à lire dans la base.
  const window = planHourlySalve(now, 0);
  if (window.kind === "skipped") return NextResponse.json(window);

  // Déjà parti dans l'heure (autre appel, clic dans l'admin) : on complète
  // seulement jusqu'à 100. Base illisible : rien n'est envoyé.
  const db = createAdminClient();
  const { count, error } = await db
    .from("user_events")
    .select("id", { count: "exact", head: true })
    .in("event_type", SALVE_EVENTS)
    .gte("created_at", new Date(now - HOURLY_SALVE_GAP_MS).toISOString());
  if (error || count === null) {
    console.error("salves-horaires: base illisible, rien envoyé", error?.message);
    return NextResponse.json({ kind: "skipped", reason: "base_illisible" }, { status: 503 });
  }
  const plan = planHourlySalve(now, count);
  if (plan.kind === "skipped") return NextResponse.json(plan);

  let remaining = plan.size;
  const results: ({ campaign: string } & BatchResult)[] = [];
  for (const id of HOURLY_SALVE_QUEUE) {
    if (remaining <= 0) break;
    let skip: Set<string>;
    try {
      skip = await skipList(db, now);
    } catch (e) {
      console.error("salves-horaires: base illisible, rien envoyé", e instanceof Error ? e.message : e);
      break;
    }
    const result = await sendNextCampaignBatch(CAMPAIGNS[id], remaining, { skip });
    results.push({ campaign: id, ...result });
    if (result.kind === "sent") {
      remaining -= result.sent;
      if (result.failures.length > 0) console.error("salves-horaires: problèmes", id, result.failures.slice(0, 5));
      // Resend ou la base en panne au milieu : pas d'autre campagne ce passage.
      if (result.failures.length > 0 && result.sent === 0) break;
    } else if (result.kind !== "done") {
      break; // plafond par 24 h atteint ou expéditeur manquant
    }
  }

  const summary = { kind: "run", size: plan.size, sent: plan.size - remaining, results: results.map((r) => (r.kind === "sent" ? { ...r, failures: r.failures.length } : r)) };
  console.log("salves-horaires", JSON.stringify(summary));
  return NextResponse.json(summary);
}
