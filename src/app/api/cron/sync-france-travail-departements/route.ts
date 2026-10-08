import type { NextRequest } from "next/server";
import { SLICES, handleDepartementsSync } from "@/lib/franceTravail/departementsSync";

// Ancienne entrée, sans numéro de tranche : la tranche est déduite de
// l'heure. Les crons (vercel.json) appellent désormais
// /api/cron/sync-france-travail-departements/[slice] : sur le plan Hobby,
// un cron peut partir en avance ou en retard (celui de 23 h 10 est parti à
// 22 h 50 le 07/10, celui de 4 h 30 à 5 h 03 le 08/10), et l'heure
// réelle refaisait alors une tranche déjà faite en sautant la suivante.
// Gardée pour un lancement manuel.

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  return handleDepartementsSync(request, new Date().getUTCHours() % SLICES);
}
