import { getMetier, METIERS, type Metier } from "@/lib/seo/metiers";
import { INDEXABLE_MIN_OFFERS, getProgrammaticIndex, type ProgrammaticIndex, type SegmentStats } from "@/lib/seo/programmaticIndex";
import { REGIONS, getDepartement, getRegionBySlug, regionOfDepartement, type Region } from "@/lib/seo/departements";
import { companySlug, getCompanyIndex } from "@/lib/seo/companyIndex";
import {
  OFFERS_OF,
  OTHER_TYPE,
  TYPE_LABEL,
  capitalize,
  departementPath,
  listCompanies,
  lowerFirst,
  plural,
  regionPath,
  salaryAnswer,
  segmentPath,
  type ProgrammaticModel,
  type SegmentLink,
} from "@/lib/seo/programmaticPage";
import type { ContractType } from "@/types/database";

// Pages /alternance/region/[region] et /alternance/region/[region]/[metier] :
// même modèle que les pages département, un étage au-dessus.

export { regionPath };

// Départements de la région avec leurs offres. Lien vers la page département
// quand elle existe, sinon vers la page de la ville qui concentre ses offres
// (Paris : le département 75 n'a pas de page, la ville si).
function departementsInRegion(index: ProgrammaticIndex, region: Region, metier: Metier | null): SegmentLink[] {
  const counts = metier
    ? Object.values(index.depCombos)
        .filter((c) => regionOfDepartement(c.dep)?.slug === region.slug && c.metier === metier.slug)
        .map((c) => ({ code: c.dep, count: c.count }))
    : (index.regions[region.slug]?.departements ?? []);
  return counts
    .map(({ code, count }) => {
      const departement = getDepartement(code);
      if (!departement) return null;
      const label = `${departement.name} (${code})`;
      const page = metier ? index.depCombos[`${metier.slug}/${code}`] : index.departements[code];
      if (page) return { href: departementPath(index.type, departement.slug, metier?.slug ?? null), label, count };
      const city = Object.values(index.cities)
        .filter((c) => c.dep === code)
        .sort((a, b) => b.count - a.count)[0];
      const cityStats = city && (metier ? index.combos[`${metier.slug}/${city.slug}`] : city);
      return city && cityStats ? { href: segmentPath(index.type, metier?.slug ?? null, city.slug), label, count } : null;
    })
    .filter((link): link is SegmentLink => link !== null)
    .sort((a, b) => b.count - a.count)
    .slice(0, 13);
}

function citiesInRegion(index: ProgrammaticIndex, region: Region, metier: Metier | null): SegmentLink[] {
  return Object.values(index.cities)
    .filter((city) => city.dep && regionOfDepartement(city.dep)?.slug === region.slug)
    .map((city) => ({ city, stats: (metier ? index.combos[`${metier.slug}/${city.slug}`] : city) as SegmentStats | undefined }))
    .filter((x): x is { city: typeof x.city; stats: SegmentStats } => Boolean(x.stats))
    .sort((a, b) => b.stats.count - a.stats.count)
    .slice(0, 12)
    .map((x) => ({ href: segmentPath(index.type, metier?.slug ?? null, x.city.slug), label: x.city.label, count: x.stats.count }));
}

function metiersInRegion(index: ProgrammaticIndex, region: Region): SegmentLink[] {
  return METIERS.map((m) => ({ m, stats: index.regionCombos[`${m.slug}/${region.slug}`] }))
    .filter((x) => x.stats)
    .sort((a, b) => b.stats!.count - a.stats!.count)
    .slice(0, 15)
    .map((x) => ({ href: regionPath(index.type, region.slug, x.m.slug), label: capitalize(x.m.label), count: x.stats!.count }));
}

function otherRegions(index: ProgrammaticIndex, region: Region, metier: Metier | null): SegmentLink[] {
  return REGIONS.filter((r) => r.slug !== region.slug)
    .map((r) => ({ r, stats: metier ? index.regionCombos[`${metier.slug}/${r.slug}`] : index.regions[r.slug] }))
    .filter((x) => x.stats)
    .sort((a, b) => b.stats!.count - a.stats!.count)
    .map((x) => ({ href: regionPath(index.type, x.r.slug, metier?.slug ?? null), label: x.r.name, count: x.stats!.count }));
}

// Partie pure (testable sans base).
export function buildRegionModel(
  index: ProgrammaticIndex,
  otherIndex: ProgrammaticIndex,
  regionSlug: string,
  metierSlug?: string,
): ProgrammaticModel | null {
  const region = getRegionBySlug(regionSlug);
  if (!region) return null;
  const metier = metierSlug ? (getMetier(metierSlug) ?? null) : null;
  if (metierSlug && !metier) return null;
  const stats = metier ? index.regionCombos[`${metier.slug}/${region.slug}`] : index.regions[region.slug];
  if (!stats) return null;

  const type = index.type;
  const typeLabel = TYPE_LABEL[type];
  const domain = metier ? ` ${metier.domain}` : "";
  const h1 = `${typeLabel}${metier ? ` ${metier.label}` : ""} ${region.phrase}`;
  const offersPhrase = `${OFFERS_OF[type]}${domain} ${region.phrase}`;
  const today = new Date(index.generatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const departements = departementsInRegion(index, region, metier);
  const cities = citiesInRegion(index, region, metier);

  const paragraphs: string[] = [];
  paragraphs.push(
    `${plural(stats.count, OFFERS_OF[type].replace("offres", "offre"), OFFERS_OF[type])}${domain} ${region.phrase} ${stats.count > 1 ? "sont" : "est"} en ligne en ce moment, publiée${stats.count > 1 ? "s" : ""} par ${plural(stats.companyCount, "entreprise")}. ` +
      (stats.recent7d > 0
        ? `${plural(stats.recent7d, "offre")} ${stats.recent7d > 1 ? "ont" : "a"} été publiée${stats.recent7d > 1 ? "s" : ""} ces 7 derniers jours.`
        : "Aucune nouvelle offre cette semaine : postule sans attendre à celles qui sont en ligne."),
  );
  if (stats.topCompanies.length > 0) paragraphs.push(`Les entreprises qui recrutent le plus : ${listCompanies(stats, 4)}.`);
  if (departements.length > 0) {
    paragraphs.push(`Les départements où il y a le plus d'offres : ${departements.slice(0, 5).map((d) => `${d.label} : ${plural(d.count, "offre")}`).join(", ")}.`);
  }
  if (cities.length > 0) {
    paragraphs.push(`Les villes qui recrutent le plus : ${cities.slice(0, 5).map((c) => `${c.label} (${c.count})`).join(", ")}.`);
  }
  const national = metier ? (index.metiers[metier.slug]?.count ?? stats.count) : index.total;
  paragraphs.push(`${capitalize(region.phrase)}, ça représente ${Math.round((stats.count / national) * 100)} % des ${OFFERS_OF[type]}${domain} en France.`);
  if (!metier) {
    const metiers = metiersInRegion(index, region).slice(0, 4);
    if (metiers.length > 0) {
      paragraphs.push(`Les métiers qui recrutent le plus ${region.phrase} : ${metiers.map((m) => `${lowerFirst(m.label)} (${m.count})`).join(", ")}.`);
    }
  }
  paragraphs.push(salaryAnswer(type, stats));

  const others = otherRegions(index, region, metier);
  const nearby = departements.length > 0 ? { title: `${typeLabel}${metier ? ` ${metier.label}` : ""} ${region.phrase} : par département`, links: departements } : null;
  const related = metier
    ? cities.length > 0
      ? { title: `${typeLabel} ${metier.label} : les villes de la région`, links: cities }
      : null
    : { title: `${typeLabel} ${region.phrase} : par métier`, links: metiersInRegion(index, region) };

  const otherStats = metier ? otherIndex.regionCombos[`${metier.slug}/${region.slug}`] : otherIndex.regions[region.slug];
  const otherType = OTHER_TYPE[type];
  const crossType = otherStats
    ? {
        href: regionPath(otherType, region.slug, metier?.slug ?? null),
        label: `${TYPE_LABEL[otherType]}${metier ? ` ${metier.label}` : ""} ${region.phrase}`,
        count: otherStats.count,
      }
    : null;
  const parentArea = metier
    ? { href: regionPath(type, region.slug, null), label: `Toutes les ${OFFERS_OF[type]} ${region.phrase}`, count: index.regions[region.slug].count }
    : null;

  const faq = [
    {
      q: `Combien y a-t-il d'${offersPhrase} ?`,
      a: `${plural(stats.count, "offre")} active${stats.count > 1 ? "s" : ""} au ${today}, publiée${stats.count > 1 ? "s" : ""} par ${plural(stats.companyCount, "entreprise")}. La liste est mise à jour chaque jour à partir de France Travail et d'Adzuna.`,
    },
    ...(departements.length > 0
      ? [{ q: `Dans quels départements chercher ?`, a: `${departements.slice(0, 6).map((d) => `${d.label} (${plural(d.count, "offre")})`).join(", ")}.` }]
      : []),
    ...(stats.topCompanies.length > 0 ? [{ q: `Quelles entreprises recrutent ${region.phrase} ?`, a: `En ce moment : ${listCompanies(stats, 5)}.` }] : []),
    { q: `Quel salaire pour ${type === "alternance" ? "une alternance" : "un stage"}${domain} ${region.phrase} ?`, a: salaryAnswer(type, stats) },
    ...(others.length > 0
      ? [{ q: `Et dans les autres régions ?`, a: `${others.slice(0, 5).map((r) => `${r.label} (${plural(r.count, "offre")})`).join(", ")}.` }]
      : []),
  ];

  const path = regionPath(type, region.slug, metier?.slug ?? null);
  const breadcrumb = [
    { name: "Accueil", path: "/" },
    { name: typeLabel, path: `/${type}` },
    { name: `${typeLabel} ${region.phrase}`, path: regionPath(type, region.slug, null) },
    ...(metier ? [{ name: h1, path }] : []),
  ];

  const companiesHint = stats.topCompanies.slice(0, 2).map((c) => c.name).join(", ");
  return {
    type,
    path,
    h1,
    title: `${h1} : ${plural(stats.count, "offre")}`,
    description: `${plural(stats.count, OFFERS_OF[type].replace("offres", "offre"), OFFERS_OF[type])}${domain} ${region.phrase} chez ${plural(stats.companyCount, "entreprise")}${companiesHint ? ` (${companiesHint}…)` : ""}. Départements et villes qui recrutent, salaires. Mis à jour chaque jour.`,
    indexable: stats.count >= INDEXABLE_MIN_OFFERS,
    stats,
    breadcrumb,
    paragraphs,
    faq,
    nearby,
    related: related && related.links.length > 0 ? related : null,
    crossType,
    parentArea,
    companies: [],
    metier,
    city: null,
  };
}

export async function resolveRegionPage(type: ContractType, regionSlug: string, metierSlug?: string): Promise<ProgrammaticModel | null> {
  const [index, otherIndex, companyIndex] = await Promise.all([
    getProgrammaticIndex(type),
    getProgrammaticIndex(OTHER_TYPE[type]),
    getCompanyIndex(),
  ]);
  const model = buildRegionModel(index, otherIndex, regionSlug, metierSlug);
  if (!model) return null;
  model.companies = model.stats.topCompanies
    .map((c) => companyIndex.companies[companySlug(c.name)])
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map((c) => ({ href: `/entreprises/${c.slug}`, label: c.label, count: c.count }));
  return model;
}

export function regionLinks(index: ProgrammaticIndex): SegmentLink[] {
  return Object.values(index.regions)
    .sort((a, b) => b.count - a.count)
    .map((r) => ({ href: regionPath(index.type, r.slug, null), label: r.label, count: r.count }));
}
