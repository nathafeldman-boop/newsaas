import type { NextRequest } from "next/server";
import { handleEmploisSync } from "@/lib/franceTravail/emploisSync";

// CDI/CDD débutants (voir emploisSync.ts) : ?mode=fresh toutes les heures,
// passe complète par région chaque nuit, ?mode=seo (offres pour Google
// seulement) toutes les heures en journée (voir vercel.json).
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const param = request.nextUrl.searchParams.get("mode");
  // 28/11 : import SEO en pause, il saturait les I/O de la base (inscriptions et
  // connexions en erreur). À relancer seulement avec un rythme plus doux.
  if (param === "seo") return Response.json({ ok: true, skipped: "seo en pause" });
  const mode = param === "fresh" ? param : "full";
  return handleEmploisSync(request, mode);
}
