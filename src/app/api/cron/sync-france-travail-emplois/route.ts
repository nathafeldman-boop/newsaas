import type { NextRequest } from "next/server";
import { handleEmploisSync } from "@/lib/franceTravail/emploisSync";

// CDI/CDD débutants (voir emploisSync.ts) : ?mode=fresh toutes les heures,
// passe complète par région chaque nuit, ?mode=seo (offres pour Google
// seulement) toutes les heures en journée (voir vercel.json).
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const param = request.nextUrl.searchParams.get("mode");
  const mode = param === "fresh" || param === "seo" ? param : "full";
  return handleEmploisSync(request, mode);
}
