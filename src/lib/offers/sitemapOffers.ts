import { createPublicClient, fetchAllRows, fetchAllRowsByIdCursor } from "@/lib/supabase/public";
import { offerPath } from "@/lib/offers/publicUrl";
import { SITEMAP_MAX_URLS, type SitemapEntry } from "@/lib/seo/sitemapXml";
import type { ContractType, Offer } from "@/types/database";

// createdAt : arrivée de l'offre sur Stageio, différente de sa date de
// publication (la synchro par département importe des offres publiées
// depuis des jours mais nouvelles ici). C'est elle qui dit si l'URL est
// nouvelle pour les moteurs.
export type OfferSitemapEntry = SitemapEntry & { createdAt: string };

type Row = Pick<Offer, "id" | "title" | "company" | "location" | "published_at" | "created_at">;

function toEntry(offer: Row): OfferSitemapEntry {
  return { path: offerPath(offer), lastModified: offer.published_at, createdAt: offer.created_at };
}

// Offres indexables (pas Adzuna, en noindex -- décision A) d'un type, paginées par tranches de 1000 (le
// plafond PostgREST) : l'ancien sitemap demandait .limit(45000) en une
// requête et ne recevait en réalité que 1000 offres sur ~5 000.
export async function fetchOfferSitemapEntries(type: ContractType): Promise<OfferSitemapEntry[]> {
  const supabase = createPublicClient();
  const rows = await fetchAllRowsByIdCursor<Row>((afterId, limit) => {
    let query = supabase
      .from("offers")
      .select("id, title, company, location, published_at, created_at")
      .eq("is_active", true)
      .eq("contract_type", type)
      .neq("source", "adzuna");
    if (afterId) query = query.gt("id", afterId);
    return query.order("id").limit(limit);
  }, SITEMAP_MAX_URLS);
  return rows.map(toEntry);
}

// Offres arrivées sur Stageio ces derniers jours (sans Indexing API) : un
// petit sitemap qui change chaque jour, que Google relit plus souvent que
// les gros, pour qu'il découvre les nouvelles fiches au plus vite.
export const RECENT_OFFERS_HOURS = 72;

export async function fetchRecentOfferSitemapEntries(): Promise<OfferSitemapEntry[]> {
  const since = new Date(Date.now() - RECENT_OFFERS_HOURS * 3600 * 1000).toISOString();
  const supabase = createPublicClient();
  const rows = await fetchAllRows<Row>(
    (from, to) =>
      supabase
        .from("offers")
        .select("id, title, company, location, published_at, created_at")
        .eq("is_active", true)
        .not("source", "in", "(adzuna,demo)")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .order("id")
        .range(from, to),
    SITEMAP_MAX_URLS,
  );
  return rows.map(toEntry);
}

// Date d'arrivée de la dernière offre indexable (de ce type, ou toutes) :
// <lastmod> des sitemaps d'offres dans l'index. null si inconnue.
export async function latestOfferCreatedAt(type?: ContractType): Promise<string | null> {
  try {
    let query = createPublicClient()
      .from("offers")
      .select("created_at")
      .eq("is_active", true)
      .not("source", "in", "(adzuna,demo)");
    if (type) query = query.eq("contract_type", type);
    const { data, error } = await query.order("created_at", { ascending: false }).limit(1);
    if (error) throw error;
    return data?.[0]?.created_at ?? null;
  } catch (err) {
    console.error("latestOfferCreatedAt failed", err);
    return null;
  }
}
