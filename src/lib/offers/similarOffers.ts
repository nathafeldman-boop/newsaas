import { createPublicClient } from "@/lib/supabase/public";
import { PUBLIC_OFFER_COLUMNS, type PublicOfferRow } from "@/lib/offers/fetchPublicOffers";
import { getCitySegments, getSectorSegments, normalizeCityKey, slugify, type CitySegment, type Segment } from "@/lib/offers/segments";
import { classifyMetier } from "@/lib/seo/metiers";
import { cityPhrase, getProgrammaticIndex } from "@/lib/seo/programmaticIndex";
import { companySlug, getCompanyIndex } from "@/lib/seo/companyIndex";
import type { Offer } from "@/types/database";

const SIMILAR_OFFERS_LIMIT = 6;

export type ProgrammaticLink = { href: string; label: string; count: number };

export type OfferContextLinks = {
  city: CitySegment | null;
  sector: Segment | null;
  similar: PublicOfferRow[];
  // Pages /alternance/[metier], /alternance/[ville], /alternance/[metier]/[ville]
  // dont relève l'offre (seulement celles qui existent, >= 3 offres).
  programmatic: { metier: ProgrammaticLink | null; city: ProgrammaticLink | null; metierCity: ProgrammaticLink | null };
  company: ProgrammaticLink | null;
};

async function getCompanyLink(offer: Offer): Promise<ProgrammaticLink | null> {
  const index = await getCompanyIndex();
  const entry = index.companies[companySlug(offer.company)];
  return entry ? { href: `/entreprises/${entry.slug}`, label: `Toutes les offres chez ${entry.label}`, count: entry.count } : null;
}

const TYPE_LABEL = { alternance: "Alternance", stage: "Stage" } as const;

async function getProgrammaticLinks(offer: Offer): Promise<OfferContextLinks["programmatic"]> {
  const index = await getProgrammaticIndex(offer.contract_type);
  const metier = classifyMetier(offer.title);
  const citySlug = slugify(normalizeCityKey(offer.location));
  const city = index.cities[citySlug];
  const typeLabel = TYPE_LABEL[offer.contract_type];
  const metierStats = metier ? index.metiers[metier.slug] : undefined;
  const comboStats = metier && city ? index.combos[`${metier.slug}/${city.slug}`] : undefined;
  return {
    metier: metier && metierStats
      ? { href: `/${offer.contract_type}/${metier.slug}`, label: `${typeLabel} ${metier.label}`, count: metierStats.count }
      : null,
    city: city ? { href: `/${offer.contract_type}/${city.slug}`, label: `${typeLabel} ${cityPhrase(city.label)}`, count: city.count } : null,
    metierCity: metier && city && comboStats
      ? { href: `/${offer.contract_type}/${metier.slug}/${city.slug}`, label: `${typeLabel} ${metier.label} ${cityPhrase(city.label)}`, count: comboStats.count }
      : null,
  };
}

// Maillage interne d'une fiche offre : sans ça, chaque fiche est une
// impasse (un seul lien "← Toutes les offres"), Google découvre les offres
// uniquement via le sitemap et les pages ville/secteur ne reçoivent aucun
// lien depuis les ~5 000 fiches. Best-effort : une erreur ici ne doit
// jamais empêcher l'affichage de la fiche elle-même.
export async function getOfferContextLinks(offer: Offer): Promise<OfferContextLinks> {
  try {
    const [citySegments, sectorSegments, programmatic, company] = await Promise.all([
      getCitySegments(),
      getSectorSegments(),
      getProgrammaticLinks(offer),
      getCompanyLink(offer),
    ]);
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

    return { city, sector, similar, programmatic, company };
  } catch (err) {
    console.error("getOfferContextLinks failed", err);
    return { city: null, sector: null, similar: [], programmatic: { metier: null, city: null, metierCity: null }, company: null };
  }
}
