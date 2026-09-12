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
  type Result = { query: string; url: string; ok: boolean; error?: string };

  // Les pipelines par requête (découverte + ingestion) tournent en
  // parallèle, au lieu d'un enchaînement 100% séquentiel -- jusqu'à 20
  // appels réseau (Mistral + fetch de pages tierces) l'un après l'autre
  // faisaient régulièrement dépasser les 60s (maxDuration, plafond Vercel
  // Hobby), perdant tout le run et les offres du jour restantes (vu en
  // prod plusieurs fois, y compris avant toute panne Mistral). Le volume
  // total de requêtes Mistral ne change pas, seule leur simultanéité augmente.
  const perQueryResults = await Promise.all(
    queries.map(async (query): Promise<Result[]> => {
      let urls: string[];
      try {
        urls = await discoverOfferUrls(query, URLS_PER_QUERY);
      } catch (err) {
        return [{ query, url: "", ok: false, error: err instanceof Error ? err.message : String(err) }];
      }

      const ingestions = await Promise.allSettled(urls.map((url) => ingestOffer({ sourceUrl: url })));
      return ingestions.map((settled, i) => {
        const url = urls[i];
        if (settled.status === "fulfilled") return { query, url, ok: true };
        const err = settled.reason;
        return { query, url, ok: false, error: err instanceof Error ? err.message : String(err) };
      });
    }),
  );

  const results = perQueryResults.flat();

  return NextResponse.json({
    queries,
    ingested: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
