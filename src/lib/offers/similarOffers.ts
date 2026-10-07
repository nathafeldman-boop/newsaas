import { createPublicClient } from "@/lib/supabase/public";
import { PUBLIC_OFFER_COLUMNS, type PublicOfferRow } from "@/lib/offers/fetchPublicOffers";
import { getCitySegments, getSectorSegments, normalizeCityKey, slugify, type CitySegment, type Segment } from "@/lib/offers/segments";
import { classifyFormations, classifyMetier } from "@/lib/seo/metiers";
import { cityPhrase, getProgrammaticIndex, type SegmentStats } from "@/lib/seo/programmaticIndex";
import { departementFromLocation, getDepartement, regionOfDepartement } from "@/lib/seo/departements";
import { departementPath, fetchOffersByIds } from "@/lib/seo/programmaticPage";
import { findCompanies, findCompany, getCompanyIndex } from "@/lib/seo/companyIndex";
import type { Offer } from "@/types/database";

const SIMILAR_OFFERS_LIMIT = 6;

export type ProgrammaticLink = { href: string; label: string; count: number };

export type OfferContextLinks = {
  city: CitySegment | null;
  sector: Segment | null;
  similar: PublicOfferRow[];
  // Pages /alternance/[metier], /alternance/[ville], /alternance/[metier]/[ville]
  // et département (métier × département, sinon département) dont relève
  // l'offre (seulement celles qui existent, >= 3 offres).
  programmatic: {
    metier: ProgrammaticLink | null;
    city: ProgrammaticLink | null;
    metierCity: ProgrammaticLink | null;
    departement: ProgrammaticLink | null;
    // Pages diplôme citées dans l'intitulé ("BTS MCO à Lyon", sinon "BTS MCO").
    formations: ProgrammaticLink[];
  };
  company: ProgrammaticLink | null;
  // Le segment le plus précis dont relève l'offre (métier × ville, sinon
  // métier × département, ville, métier en France) : chiffres propres à
  // Stageio affichés sur la fiche, à côté du texte de l'annonce d'origine.
  market: OfferMarket | null;
};

export type OfferMarket = {
  label: string;
  href: string;
  count: number;
  recent7d: number;
  salaryMedian: number | null;
  salaryN: number;
  // Autres entreprises du segment qui ont leur page (hors celle de l'offre).
  companies: ProgrammaticLink[];
};

async function getCompanyLink(offer: Offer): Promise<ProgrammaticLink | null> {
  const index = await getCompanyIndex();
  const entry = findCompany(index, offer.company);
  return entry ? { href: `/entreprises/${entry.slug}`, label: `Toutes les offres chez ${entry.label}`, count: entry.count } : null;
}

const TYPE_LABEL = { alternance: "Alternance", stage: "Stage" } as const;
const GENERIC_FORMATIONS = new Set(["bts", "cap", "bac-pro"]);

// Liens programmatiques + offres candidates pour "Offres similaires", de la
// plus proche à la plus large : même métier dans la ville, dans le
// département, même ville, même métier dans la région, même département,
// puis même métier en France (ids triés du plus récent).
type MarketSegment = { label: string; href: string; stats: SegmentStats };

async function getProgrammaticLinks(
  offer: Offer,
): Promise<{ links: OfferContextLinks["programmatic"]; similarIds: string[]; market: MarketSegment | null }> {
  const index = await getProgrammaticIndex(offer.contract_type);
  const metier = classifyMetier(offer.title);
  const citySlug = slugify(normalizeCityKey(offer.location));
  const city = index.cities[citySlug];
  const typeLabel = TYPE_LABEL[offer.contract_type];
  const metierStats = metier ? index.metiers[metier.slug] : undefined;
  const comboStats = metier && city ? index.combos[`${metier.slug}/${city.slug}`] : undefined;
  const departement = getDepartement(city?.dep ?? departementFromLocation(offer.location) ?? "");
  const depMetierStats = departement && metier ? index.depCombos[`${metier.slug}/${departement.code}`] : undefined;
  const depStats = departement ? index.departements[departement.code] : undefined;
  const where = departement ? ` ${departement.phrase}` : "";
  const region = departement ? regionOfDepartement(departement.code) : undefined;
  const regionMetierStats = region && metier ? index.regionCombos[`${metier.slug}/${region.slug}`] : undefined;
  const similarIds = [
    ...new Set(
      [comboStats, depMetierStats, city, regionMetierStats, depStats, metierStats].flatMap((stats) => stats?.ids ?? []),
    ),
  ].filter((id) => id !== offer.id);
  // Le diplôme le plus précis d'abord ("BTS MCO" avant "BTS", "CAP AEPE"
  // avant "CAP").
  const formations = classifyFormations(offer.title)
    .sort((a, b) => Number(GENERIC_FORMATIONS.has(a.slug)) - Number(GENERIC_FORMATIONS.has(b.slug)))
    .map((formation) => {
      const combo = city ? index.combos[`${formation.slug}/${city.slug}`] : undefined;
      if (combo && city) {
        return { href: `/${offer.contract_type}/${formation.slug}/${city.slug}`, label: `${typeLabel} ${formation.label} ${cityPhrase(city.label)}`, count: combo.count };
      }
      const national = index.metiers[formation.slug];
      return national ? { href: `/${offer.contract_type}/${formation.slug}`, label: `${typeLabel} ${formation.label}`, count: national.count } : null;
    })
    .filter((link): link is ProgrammaticLink => link !== null)
    .slice(0, 2);
  const links: OfferContextLinks["programmatic"] = {
    metier: metier && metierStats
      ? { href: `/${offer.contract_type}/${metier.slug}`, label: `${typeLabel} ${metier.label}`, count: metierStats.count }
      : null,
    city: city ? { href: `/${offer.contract_type}/${city.slug}`, label: `${typeLabel} ${cityPhrase(city.label)}`, count: city.count } : null,
    metierCity: metier && city && comboStats
      ? { href: `/${offer.contract_type}/${metier.slug}/${city.slug}`, label: `${typeLabel} ${metier.label} ${cityPhrase(city.label)}`, count: comboStats.count }
      : null,
    departement: !departement
      ? null
      : depMetierStats
        ? { href: departementPath(offer.contract_type, departement.slug, metier!.slug), label: `${typeLabel} ${metier!.label}${where}`, count: depMetierStats.count }
        : depStats
          ? { href: departementPath(offer.contract_type, departement.slug, null), label: `${typeLabel}${where}`, count: depStats.count }
          : null,
    formations,
  };
  const market: MarketSegment | null =
    links.metierCity && comboStats
      ? { label: links.metierCity.label, href: links.metierCity.href, stats: comboStats }
      : links.departement && depMetierStats
        ? { label: links.departement.label, href: links.departement.href, stats: depMetierStats }
        : links.city && city
          ? { label: links.city.label, href: links.city.href, stats: city }
          : links.metier && metierStats
            ? { label: `${links.metier.label} en France`, href: links.metier.href, stats: metierStats }
            : null;
  return { links, similarIds, market };
}

async function buildMarket(offer: Offer, segment: MarketSegment | null): Promise<OfferMarket | null> {
  if (!segment) return null;
  const index = await getCompanyIndex();
  const own = findCompany(index, offer.company)?.slug;
  const companies = findCompanies(index, segment.stats.topCompanies.map((c) => c.name))
    .filter((c) => c.slug !== own)
    .slice(0, 4)
    .map((c) => ({ href: `/entreprises/${c.slug}`, label: c.label, count: c.count }));
  const { count, recent7d, salaryMedian, salaryN } = segment.stats;
  return { label: segment.label, href: segment.href, count, recent7d, salaryMedian, salaryN, companies };
}

// Maillage interne d'une fiche offre : sans ça, chaque fiche est une
// impasse (un seul lien "← Toutes les offres"), Google découvre les offres
// uniquement via le sitemap et les pages ville/secteur ne reçoivent aucun
// lien depuis les ~5 000 fiches. Best-effort : une erreur ici ne doit
// jamais empêcher l'affichage de la fiche elle-même.
export async function getOfferContextLinks(offer: Offer): Promise<OfferContextLinks> {
  try {
    const [citySegments, sectorSegments, { links: programmatic, similarIds, market: marketSegment }, company] = await Promise.all([
      getCitySegments(),
      getSectorSegments(),
      getProgrammaticLinks(offer),
      getCompanyLink(offer),
    ]);
    const market = await buildMarket(offer, marketSegment);
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

    // Même métier près de chez toi d'abord (voir getProgrammaticLinks), puis
    // même ville, puis même secteur. Marge sur le nombre d'ids : certaines
    // offres de l'index (recalculé toutes les heures) ont pu être retirées.
    let similar = (await fetchOffersByIds(similarIds.slice(0, SIMILAR_OFFERS_LIMIT * 2))).slice(0, SIMILAR_OFFERS_LIMIT);
    const fill = (rows: PublicOfferRow[]) => {
      const seen = new Set([offer.id, ...similar.map((o) => o.id)]);
      similar = [...similar, ...rows.filter((o) => !seen.has(o.id))].slice(0, SIMILAR_OFFERS_LIMIT);
    };
    if (similar.length < 3 && city) {
      const { data } = await baseQuery().in("location", city.locations);
      fill((data ?? []) as PublicOfferRow[]);
    }
    if (similar.length < 3 && offer.sector) {
      const { data } = await baseQuery().eq("sector", offer.sector);
      fill((data ?? []) as PublicOfferRow[]);
    }

    return { city, sector, similar, programmatic, company, market };
  } catch (err) {
    console.error("getOfferContextLinks failed", err);
    return { city: null, sector: null, similar: [], programmatic: { metier: null, city: null, metierCity: null, departement: null, formations: [] }, company: null, market: null };
  }
}
