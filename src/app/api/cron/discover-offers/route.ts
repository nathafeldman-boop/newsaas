import { NextResponse, type NextRequest } from "next/server";
import { discoverOfferUrls } from "@/lib/mistral/discoverOfferUrls";
import { ingestOffer } from "@/lib/mistral/ingestOffer";

// Sync périodique (voir vercel.json) : demande à Mistral (recherche web
// native) de repérer des annonces réelles par secteur, puis fait repasser
// chaque URL trouvée par le pipeline d'ingestion existant (fetch de la
// vraie page + extraction Mistral classique + upsert). Complémentaire à
// /api/cron/sync-adzuna : Adzuna couvre le volume, ceci couvre les sources
// qu'un agrégateur généraliste indexe mal (petites entreprises, jobboards
// spécialisés alternance).
//
// Volume volontairement modeste (coût Mistral) : quelques requêtes par
// jour, rotation par jour de l'année sur la liste de secteurs.

export const maxDuration = 60;

const QUERIES = [
  "alternance développeur web ou informatique",
  "alternance marketing digital ou growth",
  "alternance data analyst ou data science",
  "stage UX UI design",
  "alternance ressources humaines recrutement",
  "alternance ou stage vente commercial B2B",
  "alternance finance comptabilité",
  "alternance product manager junior",
] as const;

const QUERIES_PER_RUN = 4;
const URLS_PER_QUERY = 4;

function pickQueriesForToday(): string[] {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86_400_000,
  );
  const start = (dayOfYear * QUERIES_PER_RUN) % QUERIES.length;
  return Array.from(
    { length: QUERIES_PER_RUN },
    (_, i) => QUERIES[(start + i) % QUERIES.length],
  );
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
  }

  const queries = pickQueriesForToday();
  const results: { query: string; url: string; ok: boolean; error?: string }[] =
    [];

  for (const query of queries) {
    let urls: string[];
    try {
      urls = await discoverOfferUrls(query, URLS_PER_QUERY);
    } catch (err) {
      results.push({
        query,
        url: "",
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
      continue;
    }

    for (const url of urls) {
      try {
        await ingestOffer({ sourceUrl: url });
        results.push({ query, url, ok: true });
      } catch (err) {
        results.push({
          query,
          url,
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  return NextResponse.json({
    queries,
    ingested: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
