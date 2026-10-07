import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRows } from "@/lib/supabase/public";
import { offerPath } from "@/lib/offers/publicUrl";
import { isJobPostingEligible } from "@/lib/seo/jobPosting";
import { notifyGoogle, readServiceAccount } from "@/lib/seo/googleIndexing";
import { SITE_URL } from "@/lib/site";
import type { Offer } from "@/types/database";

// Cron quotidien (voir vercel.json), après les synchros de la nuit :
// signale à Google (Indexing API) les fiches offres éligibles à Google Jobs
// arrivées sur Stageio depuis la veille, les plus récentes d'abord, dans la
// limite du quota quotidien. Les autres restent découvertes par le sitemap.
// Sans GOOGLE_INDEXING_SERVICE_ACCOUNT : ignoré (voir googleIndexing.ts).

export const maxDuration = 60;

// 2 h de chevauchement avec l'exécution de la veille (cron Hobby à l'heure
// près) : mieux vaut renvoyer une URL deux fois que d'en oublier.
const WINDOW_HOURS = 26;

type Row = Pick<Offer, "id" | "title" | "company" | "location" | "description" | "source" | "published_at">;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const account = readServiceAccount();
  if (!account) return NextResponse.json({ skipped: "GOOGLE_INDEXING_SERVICE_ACCOUNT non configuré." });
  const dailyLimit = Number(process.env.GOOGLE_INDEXING_DAILY_LIMIT) || 200;

  const since = new Date(Date.now() - WINDOW_HOURS * 3600 * 1000).toISOString();
  const admin = createAdminClient();
  const rows = await fetchAllRows<Row>((from, to) =>
    admin
      .from("offers")
      .select("id, title, company, location, description, source, published_at")
      .eq("is_active", true)
      .not("source", "in", "(adzuna,demo)")
      .gte("created_at", since)
      .order("published_at", { ascending: false })
      .order("id")
      .range(from, to),
  );
  const eligible = rows.filter(isJobPostingEligible);
  const notifications = eligible
    .slice(0, dailyLimit)
    .map((offer) => ({ url: `${SITE_URL}${offerPath(offer)}`, type: "URL_UPDATED" as const }));

  const result = notifications.length > 0 ? await notifyGoogle(account, notifications) : { sent: 0, failed: 0, quotaReached: false, errors: [] };
  const summary = { newOffers: rows.length, eligible: eligible.length, ...result };
  console.log(`google-indexing cron: ${JSON.stringify(summary)}`);
  if (result.failed > 0) console.error(`google-indexing errors: ${result.errors.join(" | ")}`);
  return NextResponse.json(summary);
}
