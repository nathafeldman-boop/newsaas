import { createPublicClient, fetchAllRows } from "@/lib/supabase/public";
import { offerPath } from "@/lib/offers/publicUrl";
import { SITEMAP_MAX_URLS, type SitemapEntry } from "@/lib/seo/sitemapXml";
import type { ContractType, Offer } from "@/types/database";

// Toutes les offres actives d'un type, paginées par tranches de 1000 (le
// plafond PostgREST) : l'ancien sitemap demandait .limit(45000) en une
// requête et ne recevait en réalité que 1000 offres sur ~5 000.
export async function fetchOfferSitemapEntries(type: ContractType): Promise<SitemapEntry[]> {
  const supabase = createPublicClient();
  const rows = await fetchAllRows<Pick<Offer, "id" | "title" | "company" | "location" | "published_at">>(
    (from, to) =>
      supabase
        .from("offers")
        .select("id, title, company, location, published_at")
        .eq("is_active", true)
        .eq("contract_type", type)
        .order("id")
        .range(from, to),
    SITEMAP_MAX_URLS,
  );
  return rows.map((offer) => ({ path: offerPath(offer), lastModified: offer.published_at }));
}
