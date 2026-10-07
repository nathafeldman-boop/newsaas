import { NextResponse, type NextRequest } from "next/server";
import { submitToIndexNow } from "@/lib/seo/indexNow";
import { collectIndexNowPaths } from "@/lib/seo/indexNowPaths";
import { SITE_URL } from "@/lib/site";

// Cron quotidien (voir vercel.json), après les imports Adzuna / France
// Travail : signale à Bing (et donc ChatGPT Search / Copilot) les nouvelles
// offres, les nouveaux guides et les pages métier / ville / entreprise dont
// les offres ont changé -- sans que personne n'ait à cliquer le bouton admin.
// Déclenché par Vercel Cron, qui envoie automatiquement
// "Authorization: Bearer $CRON_SECRET" quand cette variable est définie.

export const maxDuration = 60;

// 48 h et pas 24 : sur le plan Hobby le cron peut glisser dans l'heure, et
// un jour raté (panne, déploiement) est rattrapé le lendemain. Renvoyer une
// URL deux fois à un jour d'écart est sans conséquence.
const LOOKBACK_HOURS = 48;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
  }

  const since = new Date(Date.now() - LOOKBACK_HOURS * 3600 * 1000);
  const paths = await collectIndexNowPaths(since);
  const result = await submitToIndexNow(paths.map((path) => `${SITE_URL}${path}`));
  if (result.error) {
    console.error("indexnow cron failed", { urls: paths.length, ...result });
    return NextResponse.json({ urls: paths.length, ...result }, { status: 502 });
  }
  // Trace visible dans les logs Vercel : seule preuve que l'envoi du jour a eu lieu.
  console.log(`indexnow cron: ${result.submitted} URLs envoyées à Bing`);
  return NextResponse.json({ urls: paths.length, submitted: result.submitted });
}
