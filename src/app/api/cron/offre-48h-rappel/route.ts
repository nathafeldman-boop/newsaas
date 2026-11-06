import { NextResponse, type NextRequest } from "next/server";
import { sendOffer48Reminders } from "@/lib/campaigns/offre48Rappel";

// Rappel « lien direct » de l'offre de l'email du 5/11 (voir
// lib/campaigns/offre48Rappel.ts). vercel.json appelle la route toutes les
// 10 minutes de 7 h à 21 h UTC, jamais à l'heure pile (salves horaires) :
// le premier passage après la mise en ligne envoie tout, les suivants ne
// reprennent que les comptes mis de côté (série Premium reçue il y a moins
// de 3 h). Hors de la fenêtre (6/11 13 h 30 UTC - 7/11 12 h 55 UTC) : rien.
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const result = await sendOffer48Reminders();
  if (result.kind === "sent" && result.failures.length > 0) console.error("offre-48h-rappel: problèmes", result.failures.slice(0, 5));
  const summary = result.kind === "sent" ? { ...result, failures: result.failures.length } : result;
  console.log("offre-48h-rappel", JSON.stringify(summary));
  return NextResponse.json(summary, { status: result.kind === "skipped" && result.reason === "base_illisible" ? 503 : 200 });
}
