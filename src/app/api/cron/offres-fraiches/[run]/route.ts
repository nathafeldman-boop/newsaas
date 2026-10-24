import { NextResponse, type NextRequest } from "next/server";
import { syncFreshFranceTravailOffers } from "@/lib/franceTravail/offresFraiches";

// Offres fraîches France Travail, voir lib/franceTravail/offresFraiches.ts.
// vercel.json : un passage à :55 de chaque heure (h00 à h23 ; le plan Hobby
// n'accepte qu'un horaire par jour et par chemin). Avec Vercel Pro, un seul
// chemin en "*/5 * * * *" suffirait.
export const maxDuration = 60;

export async function GET(request: NextRequest, { params }: { params: Promise<{ run: string }> }) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (!process.env.FRANCE_TRAVAIL_CLIENT_ID || !process.env.FRANCE_TRAVAIL_CLIENT_SECRET) {
    return NextResponse.json({ skipped: "FRANCE_TRAVAIL_CLIENT_ID/SECRET non configurés." });
  }
  const { run } = await params;
  const result = await syncFreshFranceTravailOffers();
  console.log("offres-fraiches", run, JSON.stringify({ ...result, errors: result.errors.length }));
  if (result.errors.length > 0) console.error("offres-fraiches errors", result.errors.slice(0, 5).join(" | "));
  return NextResponse.json(result);
}
