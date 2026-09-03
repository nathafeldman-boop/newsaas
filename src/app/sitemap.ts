import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { offerPath } from "@/lib/offers/publicUrl";
import { SITE_URL } from "@/lib/site";

// Plafond très au-dessus du volume actuel, largement sous la limite de
// 50 000 URLs/fichier du protocole sitemap — repasser sur generateSitemaps()
// (multi-fichiers) si le catalogue d'offres actives dépasse ce seuil un jour.
const MAX_OFFERS = 45000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const { data: offers } = await supabase
    .from("offers")
    .select("id, title, company, location, published_at")
    .eq("is_active", true)
    .order("published_at", { ascending: false })
    .limit(MAX_OFFERS);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/offres`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/legal`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/legal/mentions-legales`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/legal/cgu`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/legal/cgv`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/legal/confidentialite`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/login`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/inscription`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const offerEntries: MetadataRoute.Sitemap = (offers ?? []).map((offer) => ({
    url: `${SITE_URL}${offerPath(offer)}`,
    lastModified: offer.published_at,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [...staticEntries, ...offerEntries];
}
