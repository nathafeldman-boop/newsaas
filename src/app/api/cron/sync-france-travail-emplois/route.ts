import type { NextRequest } from "next/server";
import { handleEmploisSync } from "@/lib/franceTravail/emploisSync";

// CDI/CDD débutants (voir emploisSync.ts) : ?mode=fresh toutes les heures,
// passe complète par région chaque nuit (voir vercel.json).
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("mode") === "fresh" ? "fresh" : "full";
  return handleEmploisSync(request, mode);
}
