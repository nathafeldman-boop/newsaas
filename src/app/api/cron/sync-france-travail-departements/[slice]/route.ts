import { NextResponse, type NextRequest } from "next/server";
import { SLICES, handleDepartementsSync } from "@/lib/franceTravail/departementsSync";

// Une tranche de départements par cron (voir vercel.json), numéro dans le
// chemin : le résultat ne dépend plus de l'heure à laquelle le cron part.

// 300 s (plafond du plan, valeur par défaut constatée sur /admin) : la
// recherche par nature de contrat ramène bien plus d'offres qu'avant, 60 s ne
// suffisaient plus pour les stages (tranche 4, 08/10).
export const maxDuration = 300;

export async function GET(request: NextRequest, { params }: { params: Promise<{ slice: string }> }) {
  const { slice: raw } = await params;
  const slice = Number(raw);
  if (!/^\d+$/.test(raw) || slice >= SLICES) {
    return NextResponse.json({ error: `Tranche inconnue : ${raw} (0 à ${SLICES - 1}).` }, { status: 404 });
  }
  return handleDepartementsSync(request, slice);
}
