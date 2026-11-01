import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CAMPAIGNS } from "@/lib/campaigns/relanceOffres";
import { sendNextCampaignBatch } from "@/lib/campaigns/sendBatch";
import { LASTCALL_SALVE_GAP_MS, planLastCallSalve } from "@/lib/campaigns/dernierAppelSalves";

// Campagne « Dernier appel » en salves (Nathan, 1/11 : « Programme des salves
// de 300 par heure à partir de 10h »), voir lib/campaigns/dernierAppelSalves.ts.
// vercel.json : un passage par heure de 9 h à 18 h UTC (10 h à 19 h à Paris) ;
// seul le 1/11 envoie. Chaque passage envoie le lot suivant avec les
// garde-fous de /admin/relance.
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const now = Date.now();
  // Hors fenêtre : rien à lire dans la base.
  const window = planLastCallSalve(now, 0);
  if (window.kind === "skipped") return NextResponse.json(window);

  // Déjà parti dans l'heure (autre appel, clic dans l'admin) : on complète
  // seulement jusqu'à 300. Base illisible : rien n'est envoyé.
  const { count, error } = await createAdminClient()
    .from("user_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", CAMPAIGNS.dernierappel.event)
    .gte("created_at", new Date(now - LASTCALL_SALVE_GAP_MS).toISOString());
  if (error || count === null) {
    console.error("dernier-appel: base illisible, rien envoyé", error?.message);
    return NextResponse.json({ kind: "skipped", reason: "base_illisible" }, { status: 503 });
  }
  const plan = planLastCallSalve(now, count);
  if (plan.kind === "skipped") return NextResponse.json(plan);

  const result = await sendNextCampaignBatch(CAMPAIGNS.dernierappel, plan.size);
  if (result.kind === "sent" && result.failures.length > 0) {
    console.error("dernier-appel: problèmes", result.failures.slice(0, 5));
  }
  console.log("dernier-appel", JSON.stringify(result.kind === "sent" ? { ...result, failures: result.failures.length } : result));
  return NextResponse.json(result);
}
