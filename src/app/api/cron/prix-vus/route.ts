import { NextResponse, type NextRequest } from "next/server";
import { sendPricesSeenEmails } from "@/lib/campaigns/prixVus";

// Email « tu as regardé Premium » du 7/11 (voir lib/campaigns/prixVus.ts).
// vercel.json appelle la route toutes les 10 minutes de 8 h à 10 h UTC (9 h
// à midi à Paris) : le premier passage envoie tout, les suivants ne font
// que reprendre un lot refusé. Hors de la fenêtre : rien.
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const result = await sendPricesSeenEmails();
  if (result.kind === "sent" && result.failures.length > 0) console.error("prix-vus: problèmes", result.failures.slice(0, 5));
  const summary = result.kind === "sent" ? { ...result, failures: result.failures.length } : result;
  console.log("prix-vus", JSON.stringify(summary));
  return NextResponse.json(summary, { status: result.kind === "skipped" && result.reason === "base_illisible" ? 503 : 200 });
}
