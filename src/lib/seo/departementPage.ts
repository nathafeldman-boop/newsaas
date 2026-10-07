import { getMetier, METIERS, type Metier } from "@/lib/seo/metiers";
import {
  INDEXABLE_MIN_OFFERS,
  getProgrammaticIndex,
  type DepartementEntry,
  type ProgrammaticIndex,
  type SegmentStats,
} from "@/lib/seo/programmaticIndex";
import { DEPARTEMENTS, getDepartementBySlug, regionOfDepartement, type Departement } from "@/lib/seo/departements";
import { findCompanies, getCompanyIndex } from "@/lib/seo/companyIndex";
import {
  OFFERS_OF,
  OTHER_TYPE,
  TYPE_LABEL,
  capitalize,
  departementPath,
  freshAndSalary,
  listCompanies,
  lowerFirst,
  plural,
  salaryAnswer,
  segmentPath,
  type ProgrammaticModel,
  type SegmentLink,
} from "@/lib/seo/programmaticPage";
import type { ContractType } from "@/types/database";

// Pages /alternance/departement/[dep] et /alternance/departement/[dep]/[metier].
// Même modèle que les pages métier / ville (ProgrammaticModel), avec ce qui
// n'existe qu'à cette échelle : les villes du département qui recrutent et
// les autres départements de la région.

type Dep = Departement & { slug: string };

function citiesInDepartement(index: ProgrammaticIndex, dep: Dep, metier: Metier | null): SegmentLink[] {
  return Object.values(index.cities)
    .filter((city) => city.dep === dep.code)
    .map((city) => ({ city, stats: (metier ? index.combos[`${metier.slug}/${city.slug}`] : city) as SegmentStats | undefined }))
    .filter((x): x is { city: typeof x.city; stats: SegmentStats } => Boolean(x.stats))
    .sort((a, b) => b.stats.count - a.stats.count)
    .slice(0, 12)
    .map((x) => ({ href: segmentPath(index.type, metier?.slug ?? null, x.city.slug), label: x.city.label, count: x.stats.count }));
}

function metiersInDepartement(index: ProgrammaticIndex, dep: Dep, exclude: string | null): SegmentLink[] {
  return METIERS.map((m) => ({ m, stats: index.depCombos[`${m.slug}/${dep.code}`] }))
    .filter((x) => x.stats && x.m.slug !== exclude)
    .sort((a, b) => b.stats!.count - a.stats!.count)
    .slice(0, 12)
    .map((x) => ({ href: departementPath(index.type, dep.slug, x.m.slug), label: capitalize(x.m.label), count: x.stats!.count }));
}

function regionNeighbours(index: ProgrammaticIndex, dep: Dep, metier: Metier | null): SegmentLink[] {
  return DEPARTEMENTS.filter((d) => d.region === dep.region && d.code !== dep.code)
    .map((d) => ({ d, stats: metier ? index.depCombos[`${metier.slug}/${d.code}`] : index.departements[d.code] }))
    .filter((x) => x.stats)
    .sort((a, b) => b.stats!.count - a.stats!.count)
    .map((x) => ({ href: departementPath(index.type, x.d.slug, metier?.slug ?? null), label: `${x.d.name} (${x.d.code})`, count: x.stats!.count }));
}

function departementRanking(index: ProgrammaticIndex, metier: Metier | null): { code: string; count: number }[] {
  const entries = metier
    ? Object.values(index.depCombos).filter((c) => c.metier === metier.slug).map((c) => ({ code: c.dep, count: c.count }))
    : Object.values(index.departements).map((d: DepartementEntry) => ({ code: d.code, count: d.count }));
  return entries.sort((a, b) => b.count - a.count);
}

// Partie pure (testable sans base).
export function buildDepartementModel(
  index: ProgrammaticIndex,
  otherIndex: ProgrammaticIndex,
  depSlug: string,
  metierSlug?: string,
): ProgrammaticModel | null {
  const dep = getDepartementBySlug(depSlug);
  if (!dep) return null;
  const metier = metierSlug ? (getMetier(metierSlug) ?? null) : null;
  if (metierSlug && !metier) return null;
  const stats = metier ? index.depCombos[`${metier.slug}/${dep.code}`] : index.departements[dep.code];
  if (!stats) return null;

  const type = index.type;
  const typeLabel = TYPE_LABEL[type];
  const where = ` ${dep.phrase} (${dep.code})`;
  const domain = metier ? ` ${metier.domain}` : "";
  const h1 = `${typeLabel}${metier ? ` ${metier.label}` : ""}${where}`;
  const offersPhrase = `${OFFERS_OF[type]}${domain} ${dep.phrase}`;
  const today = new Date(index.generatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const cities = citiesInDepartement(index, dep, metier);

  const paragraphs: string[] = [];
  paragraphs.push(
    `${plural(stats.count, OFFERS_OF[type].replace("offres", "offre"), OFFERS_OF[type])}${domain} ${dep.phrase} ${stats.count > 1 ? "sont" : "est"} en ligne en ce moment, publiée${stats.count > 1 ? "s" : ""} par ${plural(stats.companyCount, "entreprise")}. ` +
      (stats.recent7d > 0
        ? `${plural(stats.recent7d, "offre")} ${stats.recent7d > 1 ? "ont" : "a"} été publiée${stats.recent7d > 1 ? "s" : ""} ces 7 derniers jours.`
        : "Aucune nouvelle offre cette semaine : postule sans attendre à celles qui sont en ligne."),
  );
  if (stats.topCompanies.length > 0) {
    paragraphs.push(`Les entreprises qui recrutent le plus : ${listCompanies(stats, 4)}.`);
  }
  if (cities.length > 0) {
    paragraphs.push(`Les villes du département où il y a le plus d'offres : ${cities.slice(0, 5).map((c) => `${c.label} (${c.count})`).join(", ")}.`);
  }
  const ranking = departementRanking(index, metier);
  const rank = ranking.findIndex((r) => r.code === dep.code) + 1;
  if (rank > 0 && ranking.length > 1) {
    paragraphs.push(
      `${capitalize(dep.phrase)}, ça représente ${Math.round((stats.count / (metier ? index.metiers[metier.slug]?.count ?? stats.count : index.total)) * 100)} % des ${OFFERS_OF[type]}${domain} en France` +
        ` : le département arrive en ${rank === 1 ? "1re" : `${rank}e`} position sur ${ranking.length}.`,
    );
  }
  if (!metier) {
    const metiers = metiersInDepartement(index, dep, null).slice(0, 4);
    if (metiers.length > 0) {
      paragraphs.push(`Les métiers qui recrutent le plus ${dep.phrase} : ${metiers.map((m) => `${lowerFirst(m.label)} (${m.count})`).join(", ")}.`);
    }
  }
  paragraphs.push(salaryAnswer(type, stats));

  const neighbours = regionNeighbours(index, dep, metier);
  const nearby = neighbours.length > 0 ? { title: `${typeLabel}${metier ? ` ${metier.label}` : ""} : autres départements (${dep.region})`, links: neighbours.slice(0, 8) } : null;
  const related = metier
    ? cities.length > 0
      ? { title: `${typeLabel} ${metier.label} : les villes du département`, links: cities }
      : null
    : { title: `${typeLabel}${where} : par métier`, links: metiersInDepartement(index, dep, null) };

  const otherStats = metier ? otherIndex.depCombos[`${metier.slug}/${dep.code}`] : otherIndex.departements[dep.code];
  const otherType = OTHER_TYPE[type];
  const crossType = otherStats
    ? {
        href: departementPath(otherType, dep.slug, metier?.slug ?? null),
        label: `${TYPE_LABEL[otherType]}${metier ? ` ${metier.label}` : ""}${where}`,
        count: otherStats.count,
      }
    : null;
  const region = regionOfDepartement(dep.code);
  const regionStats = region ? index.regions[region.slug] : undefined;
  const parentArea = metier
    ? { href: departementPath(type, dep.slug, null), label: `Toutes les ${OFFERS_OF[type]} ${dep.phrase}`, count: index.departements[dep.code].count }
    : region && regionStats
      ? { href: `/${type}/region/${region.slug}`, label: `${typeLabel} ${region.phrase}`, count: regionStats.count }
      : null;

  const faq = [
    {
      q: `Combien y a-t-il d'${offersPhrase} ?`,
      a: `${plural(stats.count, "offre")} active${stats.count > 1 ? "s" : ""} au ${today}, publiée${stats.count > 1 ? "s" : ""} par ${plural(stats.companyCount, "entreprise")}. La liste est mise à jour chaque jour à partir de France Travail et d'Adzuna.`,
    },
    ...(cities.length > 0
      ? [{ q: `Dans quelles villes du département chercher ?`, a: `${cities.slice(0, 6).map((c) => `${c.label} (${plural(c.count, "offre")})`).join(", ")}.` }]
      : []),
    ...(stats.topCompanies.length > 0 ? [{ q: `Quelles entreprises recrutent ${dep.phrase} ?`, a: `En ce moment : ${listCompanies(stats, 5)}.` }] : []),
    { q: `Quel salaire pour ${type === "alternance" ? "une alternance" : "un stage"}${domain} ${dep.phrase} ?`, a: salaryAnswer(type, stats) },
  ];

  const path = departementPath(type, dep.slug, metier?.slug ?? null);
  const breadcrumb = [
    { name: "Accueil", path: "/" },
    { name: typeLabel, path: `/${type}` },
    { name: `${typeLabel}${where}`, path: departementPath(type, dep.slug, null) },
    ...(metier ? [{ name: h1, path }] : []),
  ];

  const companiesHint = stats.topCompanies.slice(0, 2).map((c) => c.name).join(", ");
  return {
    type,
    path,
    h1,
    title: `${h1} : ${plural(stats.count, "offre")}`,
    description: `${plural(stats.count, OFFERS_OF[type].replace("offres", "offre"), OFFERS_OF[type])}${domain} ${dep.phrase} (${dep.code}) chez ${plural(stats.companyCount, "entreprise")}${companiesHint ? ` (${companiesHint}…)` : ""}${freshAndSalary(stats)} Mis à jour chaque jour.`,
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

export async function resolveDepartementPage(
  type: ContractType,
  depSlug: string,
  metierSlug?: string,
): Promise<ProgrammaticModel | null> {
  const [index, otherIndex, companyIndex] = await Promise.all([
    getProgrammaticIndex(type),
    getProgrammaticIndex(OTHER_TYPE[type]),
    getCompanyIndex(),
  ]);
  const model = buildDepartementModel(index, otherIndex, depSlug, metierSlug);
  if (!model) return null;
  model.companies = findCompanies(companyIndex, model.stats.topCompanies.map((c) => c.name))
    .map((c) => ({ href: `/entreprises/${c.slug}`, label: c.label, count: c.count }));
  return model;
}

// Liens "Par département" des hubs /alternance et /stage.
export function departementLinks(index: ProgrammaticIndex): SegmentLink[] {
  return Object.values(index.departements)
    .sort((a, b) => b.count - a.count)
    .map((d) => ({ href: departementPath(index.type, d.slug, null), label: `${d.label} (${d.code})`, count: d.count }));
}
