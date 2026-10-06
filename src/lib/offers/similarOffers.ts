import { createPublicClient } from "@/lib/supabase/public";
import { PUBLIC_OFFER_COLUMNS, type PublicOfferRow } from "@/lib/offers/fetchPublicOffers";
import { getCitySegments, getSectorSegments, type CitySegment, type Segment } from "@/lib/offers/segments";
import type { Offer } from "@/types/database";

const SIMILAR_OFFERS_LIMIT = 6;

export type OfferContextLinks = {
  city: CitySegment | null;
  sector: Segment | null;
  similar: PublicOfferRow[];
};

// Maillage interne d'une fiche offre : sans ça, chaque fiche est une
// impasse (un seul lien "← Toutes les offres"), Google découvre les offres
// uniquement via le sitemap et les pages ville/secteur ne reçoivent aucun
// lien depuis les ~5 000 fiches. Best-effort : une erreur ici ne doit
// jamais empêcher l'affichage de la fiche elle-même.
export async function getOfferContextLinks(offer: Offer): Promise<OfferContextLinks> {
  try {
    const [citySegments, sectorSegments] = await Promise.all([getCitySegments(), getSectorSegments()]);
    const city = citySegments.find((segment) => segment.locations.includes(offer.location)) ?? null;
    const sector = offer.sector ? (sectorSegments.find((segment) => segment.label === offer.sector) ?? null) : null;

    const supabase = createPublicClient();
    const baseQuery = () =>
      supabase
        .from("offers")
        .select(PUBLIC_OFFER_COLUMNS)
        .eq("is_active", true)
        .eq("contract_type", offer.contract_type)
        .neq("id", offer.id)
        .order("published_at", { ascending: false })
        .limit(SIMILAR_OFFERS_LIMIT);

    // Même ville d'abord (le critère n°1 d'un étudiant), sinon même secteur.
    let similar: PublicOfferRow[] = [];
    if (city) {
      const { data } = await baseQuery().in("location", city.locations);
      similar = (data ?? []) as PublicOfferRow[];
    }
    if (similar.length < 3 && offer.sector) {
      const { data } = await baseQuery().eq("sector", offer.sector);
      const seen = new Set(similar.map((o) => o.id));
      similar = [...similar, ...((data ?? []) as PublicOfferRow[]).filter((o) => !seen.has(o.id))].slice(
        0,
        SIMILAR_OFFERS_LIMIT,
      );
    }

    return { city, sector, similar };
  } catch (err) {
    console.error("getOfferContextLinks failed", err);
    return { city: null, sector: null, similar: [] };
  }
}
