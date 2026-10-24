import { NextResponse, type NextRequest } from "next/server";
import { syncFreshFranceTravailOffers } from "@/lib/franceTravail/offresFraiches";

// Offres fraîches France Travail, voir lib/franceTravail/offresFraiches.ts.
// vercel.json : /api/cron/offres-fraiches/live, chaque minute (Vercel Pro).
// Log seulement quand il se passe quelque chose : 1 440 passages par jour.
export const maxDuration = 60;

export async function GET(request: NextRequest, { params }: { params: Promise<{ run: string }> }) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (!process.env.FRANCE_TRAVAIL_CLIENT_ID || !process.env.FRANCE_TRAVAIL_CLIENT_SECRET) {
    return NextResponse.json({ skipped: "FRANCE_TRAVAIL_CLIENT_ID/SECRET non configurés." });
  }
  // Pendant la synchro de nuit (0 h 10 à 3 h 45 UTC, puis 4 h 30) : elle
  // revoit déjà tout, et deux synchros ensemble dépasseraient les 3 appels
  // par seconde de l'API (pages perdues, offres retirées à tort ensuite).
  const utc = new Date();
  const minutes = utc.getUTCHours() * 60 + utc.getUTCMinutes();
  if ((minutes >= 5 && minutes < 3 * 60 + 55) || (minutes >= 4 * 60 + 25 && minutes < 4 * 60 + 40)) {
    return NextResponse.json({ skipped: "synchro de nuit en cours" });
  }
  const { run } = await params;
  const result = await syncFreshFranceTravailOffers();
  if (result.added > 0 || result.capped > 0 || result.truncated > 0) {
    console.log("offres-fraiches", run, JSON.stringify({ ...result, errors: result.errors.length }));
  }
  if (result.errors.length > 0) console.error("offres-fraiches errors", result.errors.slice(0, 5).join(" | "));
  return NextResponse.json(result);
}
