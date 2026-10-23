import { NextResponse, type NextRequest } from "next/server";
import { sendSeriesRun } from "@/lib/campaigns/serieVente";

// Série d'emails Premium (24/10), voir lib/campaigns/serieVente.ts.
// vercel.json : un passage à la demie de chaque heure de 5 h 30 à 19 h 30 UTC ;
// seuls ceux de 7 h 30 à 20 h 30 à Paris envoient (changement d'heure
// compris), chacun une part du quota du jour.
export const maxDuration = 300;

export async function GET(request: NextRequest, { params }: { params: Promise<{ run: string }> }) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const { run } = await params;
  const result = await sendSeriesRun();
  if (result.kind === "sent" && result.failures.length > 0) {
    console.error("serie-premium: problèmes", result.failures.slice(0, 5));
  }
  console.log("serie-premium", run, JSON.stringify(result.kind === "sent" ? { ...result, failures: result.failures.length } : result));
  return NextResponse.json(result);
}
