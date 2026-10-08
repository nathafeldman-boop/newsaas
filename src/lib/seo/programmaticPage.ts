import { createPublicClient } from "@/lib/supabase/public";
import { PUBLIC_OFFER_COLUMNS, PUBLIC_OFFERS_PAGE_SIZE, type PublicOfferRow } from "@/lib/offers/fetchPublicOffers";
import { FORMATIONS, getMetier, isFormation, METIERS, type Metier } from "@/lib/seo/metiers";
import { CITY_COORDINATES, distanceKm } from "@/lib/seo/cityCoordinates";
import {
  INDEXABLE_MIN_OFFERS,
  cityPhrase,
  getProgrammaticIndex,
  type CityEntry,
  type ProgrammaticIndex,
  type SegmentStats,
} from "@/lib/seo/programmaticIndex";
import {
  SMIC_MONTHLY_GROSS,
  STAGE_HOURLY_MIN,
  formatEuros,
  internshipGratification,
  round2,
} from "@/lib/salary/legalRates";
import { findCompanies, getCompanyIndex } from "@/lib/seo/companyIndex";
import { getDepartement } from "@/lib/seo/departements";
import type { ContractType } from "@/types/database";

export type SegmentLink = { href: string; label: string; count: number };

export type ProgrammaticModel = {
  type: ContractType;
  path: string;
  h1: string;
  title: string;
  description: string;
  indexable: boolean;
  stats: SegmentStats;
  breadcrumb: { name: string; path: string }[];
  paragraphs: string[];
  faq: { q: string; a: string }[];
  nearby: { title: string; links: SegmentLink[] } | null;
  related: { title: string; links: SegmentLink[] } | null;
  crossType: SegmentLink | null;
  // Page département qui contient la ville (pages ville et métier × ville).
  parentArea: SegmentLink | null;
  // Diplômes avec une page dans la ville (pages ville seulement).
  formations?: SegmentLink[];
  // Régions qui ont une page pour ce métier (pages métier France entière).
  regions?: SegmentLink[];
  companies: SegmentLink[];
  metier: Metier | null;
  city: CityEntry | null;
  // Date du dernier recalcul de l'index (ISO), affichée sous le titre.
  updatedAt: string;
};

export const TYPE_LABEL: Record<ContractType, string> = { alternance: "Alternance", stage: "Stage" };
export const OFFERS_OF: Record<ContractType, string> = { alternance: "offres d'alternance", stage: "offres de stage" };
export const OTHER_TYPE: Record<ContractType, ContractType> = { alternance: "stage", stage: "alternance" };

// Fin de meta description avec les chiffres propres à la page (offres de la
// semaine, salaire médian indiqué) plutôt qu'une liste générique : c'est
// ce qui donne envie de cliquer dans les résultats.
export function freshAndSalary(stats: SegmentStats): string {
  const fresh = stats.recent7d > 0 ? `, dont ${stats.recent7d.toLocaleString("fr-FR")} cette semaine` : "";
  const salary = stats.salaryMedian !== null ? ` Salaire médian indiqué : ${formatEuros(stats.salaryMedian, 0)} brut par mois.` : "";
  return `${fresh}.${salary}`;
}

// « octobre 2026 » (heure de Paris), pour les titres : sur une recherche
// d'offres, le mois en cours dans le titre signale une liste à jour.
export function monthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "Europe/Paris" });
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// "Assistant administratif" -> "assistant administratif", mais "RH" et
// "BTP" restent des sigles.
export function lowerFirst(label: string): string {
  return /^\p{Lu}\p{Lu}/u.test(label) ? label : label.charAt(0).toLowerCase() + label.slice(1);
}

export function plural(n: number, singular: string, pluralForm = `${singular}s`) {
  return `${n.toLocaleString("fr-FR")} ${n > 1 ? pluralForm : singular}`;
}

export function listCompanies(stats: SegmentStats, max = 3): string {
  return stats.topCompanies
    .slice(0, max)
    .map((c) => (c.count > 1 ? `${c.name} (${c.count} offres)` : c.name))
    .join(", ");
}

export function segmentPath(type: ContractType, metier: string | null, city: string | null): string {
  return `/${type}/${[metier, city].filter(Boolean).join("/")}`;
}

export function salaryAnswer(type: ContractType, stats: SegmentStats): string {
  const observed =
    stats.salaryMedian !== null
      ? `Dans les offres qui l'indiquent (${stats.salaryN} offres France Travail), le salaire médian est de ${formatEuros(stats.salaryMedian, 0)} brut par mois. `
      : "";
  if (type === "alternance") {
    return `${observed}Le minimum légal dépend de ton âge et de ton année de contrat : de ${formatEuros(round2(SMIC_MONTHLY_GROSS * 0.27), 0)} à ${formatEuros(SMIC_MONTHLY_GROSS, 0)} brut par mois en apprentissage (par exemple ${formatEuros(round2(SMIC_MONTHLY_GROSS * 0.43), 0)} à 18-20 ans en 1re année). Calcule ton montant exact avec le simulateur de salaire.`;
  }
  return `${observed}La gratification minimale est de ${STAGE_HOURLY_MIN.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} € par heure, soit environ ${formatEuros(internshipGratification(35).gross, 0)} par mois à temps plein, obligatoire au-delà de 2 mois de stage.`;
}

function nearbyCities(
  index: ProgrammaticIndex,
  city: CityEntry,
  metier: Metier | null,
): { title: string; links: SegmentLink[] } | null {
  const candidates = Object.values(index.cities)
    .filter((c) => c.slug !== city.slug)
    .map((c) => {
      const stats = metier ? index.combos[`${metier.slug}/${c.slug}`] : c;
      return stats ? { city: c, count: stats.count } : null;
    })
    .filter((c): c is { city: CityEntry; count: number } => c !== null);

  const origin = CITY_COORDINATES[city.slug];
  const ranked = origin
    ? candidates
        .filter((c) => CITY_COORDINATES[c.city.slug])
        .map((c) => ({ ...c, km: distanceKm(origin, CITY_COORDINATES[c.city.slug]) }))
        .filter((c) => c.km <= 80)
        .sort((a, b) => a.km - b.km)
    : [];
  const list = (ranked.length >= 3 ? ranked : [...candidates].sort((a, b) => b.count - a.count)).slice(0, 8);
  if (list.length === 0) return null;

  const what = `${TYPE_LABEL[index.type]}${metier ? ` ${metier.label}` : ""}`;
  return {
    title: ranked.length >= 3 ? `${what} près de ${city.label}` : `${what} : autres villes qui recrutent`,
    links: list.map((c) => ({
      href: segmentPath(index.type, metier?.slug ?? null, c.city.slug),
      label: c.city.label,
      count: c.count,
    })),
  };
}

function metiersInCity(index: ProgrammaticIndex, city: CityEntry, exclude: string | null): SegmentLink[] {
  return METIERS.map((m) => ({ m, stats: index.combos[`${m.slug}/${city.slug}`] }))
    .filter((x) => x.stats && x.m.slug !== exclude)
    .sort((a, b) => b.stats!.count - a.stats!.count)
    .slice(0, 12)
    .map((x) => ({
      href: segmentPath(index.type, x.m.slug, city.slug),
      label: capitalize(x.m.label),
      count: x.stats!.count,
    }));
}

function citiesForMetier(index: ProgrammaticIndex, metier: Metier): SegmentLink[] {
  return Object.values(index.combos)
    .filter((c) => c.metier === metier.slug)
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
    .map((c) => ({
      href: segmentPath(index.type, metier.slug, c.city),
      label: index.cities[c.city].label,
      count: c.count,
    }));
}

function topMetiers(index: ProgrammaticIndex): SegmentLink[] {
  return METIERS.map((m) => ({ m, stats: index.metiers[m.slug] }))
    .filter((x) => x.stats)
    .sort((a, b) => b.stats!.count - a.stats!.count)
    .map((x) => ({ href: segmentPath(index.type, x.m.slug, null), label: capitalize(x.m.label), count: x.stats!.count }));
}

// Résout /alternance/[slug] et /alternance/[slug]/[ville]. null => 404 (le
// segment n'existe pas ou compte moins de PAGE_MIN_OFFERS offres).
export async function resolveProgrammaticPage(
  type: ContractType,
  slug: string,
  ville?: string,
): Promise<ProgrammaticModel | null> {
  const [index, otherIndex, companyIndex] = await Promise.all([
    getProgrammaticIndex(type),
    getProgrammaticIndex(OTHER_TYPE[type]),
    getCompanyIndex(),
  ]);
  const model = buildProgrammaticModel(index, otherIndex, slug, ville);
  if (!model) return null;
  // Entreprises du segment qui ont leur propre page /entreprises/[slug].
  model.companies = findCompanies(companyIndex, model.stats.topCompanies.map((c) => c.name))
    .map((c) => ({ href: `/entreprises/${c.slug}`, label: c.label, count: c.count }));
  return model;
}

// Partie pure (testable sans base).
export function buildProgrammaticModel(
  index: ProgrammaticIndex,
  otherIndex: ProgrammaticIndex,
  slug: string,
  ville?: string,
): ProgrammaticModel | null {
  const type = index.type;
  const metier = getMetier(slug) ?? null;
  const city = ville ? (index.cities[ville] ?? null) : metier ? null : (index.cities[slug] ?? null);

  let stats: SegmentStats | undefined;
  if (metier && ville) stats = city ? index.combos[`${metier.slug}/${city.slug}`] : undefined;
  else if (metier && !ville) stats = index.metiers[metier.slug];
  else if (!metier && !ville) stats = city ?? undefined;
  if (!stats) return null;

  const typeLabel = TYPE_LABEL[type];
  const where = city ? ` ${cityPhrase(city.label)}` : "";
  const domain = metier ? ` ${metier.domain}` : "";
  const h1 = `${typeLabel}${metier ? ` ${metier.label}` : ""}${where}`;
  const offersPhrase = `${OFFERS_OF[type]}${domain}${where}`;
  const today = new Date(index.generatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });

  const paragraphs: string[] = [];
  paragraphs.push(
    `${plural(stats.count, OFFERS_OF[type].replace("offres", "offre"), OFFERS_OF[type])}${domain}${where} ${stats.count > 1 ? "sont" : "est"} en ligne en ce moment, publiée${stats.count > 1 ? "s" : ""} par ${plural(stats.companyCount, "entreprise")}. ` +
      (stats.recent7d > 0
        ? `${plural(stats.recent7d, "offre")} ${stats.recent7d > 1 ? "ont" : "a"} été publiée${stats.recent7d > 1 ? "s" : ""} ces 7 derniers jours : le marché bouge, les premiers à postuler sont les plus lus.`
        : "Aucune nouvelle offre cette semaine : postule sans attendre à celles qui sont en ligne."),
  );
  // Diplômes : le paragraphe vaut pour chaque ville. Métiers : seulement sur
  // la page nationale, pour ne pas répéter le même texte sur des centaines
  // de pages métier × ville.
  // Le paragraphe du métier (missions, diplômes) est dans la FAQ plus bas,
  // une seule fois sur la page.
  if (stats.topCompanies.length > 0) {
    paragraphs.push(`Les entreprises qui recrutent le plus : ${listCompanies(stats, 4)}.`);
  }
  if (metier && city) {
    const cityTotal = index.cities[city.slug].count;
    const share = Math.round((stats.count / cityTotal) * 100);
    const ranking = Object.values(index.combos)
      .filter((c) => c.metier === metier.slug)
      .sort((a, b) => b.count - a.count);
    const rank = ranking.findIndex((c) => c.city === city.slug) + 1;
    const leaders = ranking
      .filter((c) => c.city !== city.slug)
      .slice(0, 3)
      .map((c) => `${index.cities[c.city].label} (${c.count})`)
      .join(", ");
    paragraphs.push(
      `${capitalize(cityPhrase(city.label))}, les offres « ${metier.label} » représentent ${share} % des ${cityTotal.toLocaleString("fr-FR")} ${OFFERS_OF[type]}. ` +
        `Au niveau national, on compte ${plural(index.metiers[metier.slug].count, OFFERS_OF[type].replace("offres", "offre"), OFFERS_OF[type])}${domain}` +
        (rank > 0 ? `, et ${city.label} arrive en ${rank === 1 ? "1re" : `${rank}e`} position` : "") +
        (leaders ? ` (autres villes : ${leaders}).` : "."),
    );
  } else if (metier) {
    const cities = citiesForMetier(index, metier).slice(0, 4);
    if (cities.length > 0) {
      paragraphs.push(`Les villes où il y a le plus d'${offersPhrase} : ${cities.map((c) => `${c.label} (${c.count})`).join(", ")}.`);
    }
  } else if (city) {
    const metiers = metiersInCity(index, city, null).slice(0, 4);
    if (metiers.length > 0) {
      paragraphs.push(`Les métiers qui recrutent le plus ${cityPhrase(city.label)} : ${metiers.map((m) => `${lowerFirst(m.label)} (${m.count})`).join(", ")}.`);
    }
  }
  paragraphs.push(salaryAnswer(type, stats));

  const nearby = city ? nearbyCities(index, city, metier) : null;
  const related = city
    ? { title: `${typeLabel} ${cityPhrase(city.label)} : ${metier ? "autres métiers" : "par métier"}`, links: metiersInCity(index, city, metier?.slug ?? null) }
    : metier
      ? { title: `${typeLabel} ${metier.label} : les villes qui recrutent`, links: citiesForMetier(index, metier) }
      : null;

  const otherStats = metier && city
    ? otherIndex.combos[`${metier.slug}/${city.slug}`]
    : metier
      ? otherIndex.metiers[metier.slug]
      : city
        ? otherIndex.cities[city.slug]
        : undefined;
  const otherType = OTHER_TYPE[type];
  const crossType = otherStats
    ? {
        href: segmentPath(otherType, metier?.slug ?? null, city?.slug ?? null),
        label: `${TYPE_LABEL[otherType]}${metier ? ` ${metier.label}` : ""}${where}`,
        count: otherStats.count,
      }
    : null;

  const faq = [
    {
      q: `Combien y a-t-il d'${offersPhrase} ?`,
      a: `${plural(stats.count, "offre")} active${stats.count > 1 ? "s" : ""} au ${today}, publiée${stats.count > 1 ? "s" : ""} par ${plural(stats.companyCount, "entreprise")}. La liste est mise à jour chaque jour à partir de France Travail et d'Adzuna.`,
    },
    ...(stats.topCompanies.length > 0
      ? [{ q: `Quelles entreprises publient des ${offersPhrase} ?`, a: `En ce moment : ${listCompanies(stats, 5)}.` }]
      : []),
    { q: `Quel salaire pour ${type === "alternance" ? "une alternance" : "un stage"}${domain}${where} ?`, a: salaryAnswer(type, stats) },
    // Le paragraphe du métier ou du diplôme (missions, formations) aussi en
    // FAQ : c'est la forme que reprennent les extraits de Google et les IA.
    ...(metier?.about && (!city || isFormation(metier.slug))
      ? [{
          q: isFormation(metier.slug)
            ? `C'est quoi, ${type === "alternance" ? "une alternance" : "un stage"} ${metier.domain} ?`
            : `Quelles missions et quels diplômes pour ${type === "alternance" ? "une alternance" : "un stage"} ${metier.domain} ?`,
          a: metier.about,
        }]
      : []),
    ...(nearby && nearby.links.length > 0
      ? [{ q: `Où trouver d'autres ${OFFERS_OF[type]}${domain} près de ${city!.label} ?`, a: `${nearby.links.slice(0, 5).map((l) => `${l.label} (${plural(l.count, "offre")})`).join(", ")}.` }]
      : []),
  ];

  const breadcrumb = [
    { name: "Accueil", path: "/" },
    { name: typeLabel, path: `/${type}` },
    ...(metier ? [{ name: `${typeLabel} ${metier.label}`, path: segmentPath(type, metier.slug, null) }] : []),
    ...(city ? [{ name: `${h1}`, path: segmentPath(type, metier?.slug ?? null, city.slug) }] : []),
  ];

  const companiesHint = stats.topCompanies.slice(0, 2).map((c) => c.name).join(", ");
  return {
    type,
    path: segmentPath(type, metier?.slug ?? null, city?.slug ?? null),
    h1,
    title: `${h1} : ${plural(stats.count, "offre")} en ${monthYear(index.generatedAt)}`,
    description: `${plural(stats.count, OFFERS_OF[type].replace("offres", "offre"), OFFERS_OF[type])}${domain}${where} chez ${plural(stats.companyCount, "entreprise")}${companiesHint ? ` (${companiesHint}…)` : ""}${freshAndSalary(stats)} Mis à jour chaque jour.`,
    indexable: stats.count >= INDEXABLE_MIN_OFFERS,
    stats,
    breadcrumb,
    paragraphs,
    faq,
    nearby,
    related: related && related.links.length > 0 ? related : null,
    crossType,
    parentArea: parentArea(index, metier, city),
    formations: city && !metier ? formationsInCity(index, city.slug) : undefined,
    regions: metier && !city ? regionsForMetier(index, metier) : undefined,
    companies: [],
    metier,
    city,
    updatedAt: index.generatedAt,
  };
}

function parentArea(index: ProgrammaticIndex, metier: Metier | null, city: CityEntry | null): SegmentLink | null {
  if (!city?.dep) return null;
  const departement = getDepartement(city.dep);
  const stats = metier ? index.depCombos[`${metier.slug}/${city.dep}`] : index.departements[city.dep];
  if (!departement || !stats) return null;
  return {
    href: departementPath(index.type, departement.slug, metier?.slug ?? null),
    label: `${TYPE_LABEL[index.type]}${metier ? ` ${metier.label}` : ""} ${departement.phrase} (${departement.code})`,
    count: stats.count,
  };
}

export function departementPath(type: ContractType, departementSlug: string, metier: string | null): string {
  return `/${type}/departement/${departementSlug}${metier ? `/${metier}` : ""}`;
}

export function regionPath(type: ContractType, region: string, metier: string | null): string {
  return `/${type}/region/${region}${metier ? `/${metier}` : ""}`;
}

function regionsForMetier(index: ProgrammaticIndex, metier: Metier): SegmentLink[] {
  return Object.values(index.regionCombos)
    .filter((c) => c.metier === metier.slug && index.regions[c.region])
    .sort((a, b) => b.count - a.count)
    .map((c) => ({ href: regionPath(index.type, c.region, metier.slug), label: index.regions[c.region].label, count: c.count }));
}

export async function fetchOffersByIds(ids: string[]): Promise<PublicOfferRow[]> {
  if (ids.length === 0) return [];
  const { data, error } = await createPublicClient()
    .from("offers")
    .select(PUBLIC_OFFER_COLUMNS)
    .in("id", ids)
    .eq("is_active", true);
  if (error) throw new Error(error.message);
  const byId = new Map(((data ?? []) as PublicOfferRow[]).map((o) => [o.id, o]));
  return ids.map((id) => byId.get(id)).filter((o): o is PublicOfferRow => Boolean(o));
}

export function pageIds(stats: { ids: string[] }, page: number): string[] {
  return stats.ids.slice((page - 1) * PUBLIC_OFFERS_PAGE_SIZE, page * PUBLIC_OFFERS_PAGE_SIZE);
}

export function listedPages(stats: { ids: string[] }): number {
  return Math.max(1, Math.ceil(stats.ids.length / PUBLIC_OFFERS_PAGE_SIZE));
}

export async function getHubModel(type: ContractType) {
  const index = await getProgrammaticIndex(type);
  const cities = Object.values(index.cities)
    .sort((a, b) => b.count - a.count)
    .slice(0, 48)
    .map((c) => ({ href: segmentPath(type, null, c.slug), label: c.label, count: c.count }));
  const formations = FORMATIONS.map((f) => ({ f, stats: index.metiers[f.slug] }))
    .filter((x) => x.stats)
    .sort((a, b) => b.stats!.count - a.stats!.count)
    .map((x) => ({ href: segmentPath(type, x.f.slug, null), label: x.f.label.charAt(0).toUpperCase() + x.f.label.slice(1), count: x.stats!.count }));
  return { index, metiers: topMetiers(index), cities, formations };
}

// Diplômes présents dans une ville (pages ville : "par diplôme").
export function formationsInCity(index: ProgrammaticIndex, citySlug: string): SegmentLink[] {
  return FORMATIONS.map((f) => ({ f, stats: index.combos[`${f.slug}/${citySlug}`] }))
    .filter((x) => x.stats)
    .sort((a, b) => b.stats!.count - a.stats!.count)
    .map((x) => ({ href: segmentPath(index.type, x.f.slug, citySlug), label: x.f.label.charAt(0).toUpperCase() + x.f.label.slice(1), count: x.stats!.count }));
}
