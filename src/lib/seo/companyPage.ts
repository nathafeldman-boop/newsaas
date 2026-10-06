import { getCompanyIndex, type CompanyEntry } from "@/lib/seo/companyIndex";
import { getProgrammaticIndex, INDEXABLE_MIN_OFFERS, cityPhrase } from "@/lib/seo/programmaticIndex";
import { formatEuros } from "@/lib/salary/legalRates";
import type { SegmentLink } from "@/lib/seo/programmaticPage";
import type { ContractType } from "@/types/database";

export type CompanyModel = {
  company: CompanyEntry;
  path: string;
  h1: string;
  title: string;
  description: string;
  indexable: boolean;
  paragraphs: string[];
  faq: { q: string; a: string }[];
  cityLinks: SegmentLink[];
  metierLinks: SegmentLink[];
  related: SegmentLink[];
};

function n(count: number, singular: string, plural = `${singular}s`) {
  return `${count.toLocaleString("fr-FR")} ${count > 1 ? plural : singular}`;
}

function dominantType(company: CompanyEntry): ContractType {
  return company.byType.alternance >= company.byType.stage ? "alternance" : "stage";
}

export async function resolveCompanyPage(slug: string): Promise<CompanyModel | null> {
  const [index, alternance, stage] = await Promise.all([
    getCompanyIndex(),
    getProgrammaticIndex("alternance"),
    getProgrammaticIndex("stage"),
  ]);
  const company = index.companies[slug];
  if (!company) return null;
  const programmatic = { alternance, stage };
  const main = dominantType(company);
  const { alternance: alt, stage: stg } = company.byType;

  const kind = alt > 0 && stg > 0 ? "Alternance et stage" : alt > 0 ? "Alternance" : "Stage";
  const h1 = `${kind} chez ${company.label}`;
  const split = [alt > 0 ? n(alt, "en alternance", "en alternance") : null, stg > 0 ? n(stg, "en stage", "en stage") : null]
    .filter(Boolean)
    .join(" et ");
  const topCities = company.cities.slice(0, 3).map((c) => c.label);

  const paragraphs: string[] = [
    `${company.label} publie en ce moment ${n(company.count, "offre")} : ${split}. ` +
      (company.recent7d > 0
        ? `${n(company.recent7d, "offre a", "offres ont")} été publiée${company.recent7d > 1 ? "s" : ""} ces 7 derniers jours.`
        : "Aucune nouvelle offre cette semaine."),
  ];
  if (company.cities.length > 0) {
    paragraphs.push(
      `Où ${company.label} recrute : ${company.cities.map((c) => `${c.label} (${c.count})`).join(", ")}.`,
    );
  }
  if (company.metiers.length > 0) {
    paragraphs.push(
      `Les métiers les plus proposés : ${company.metiers.map((m) => `${m.label} (${m.count})`).join(", ")}.`,
    );
  }
  if (company.salaryMedian !== null) {
    paragraphs.push(
      `Salaire médian indiqué dans ses offres France Travail : ${formatEuros(company.salaryMedian, 0)} brut par mois (sur ${company.salaryN} offres).`,
    );
  }

  const cityLinks: SegmentLink[] = company.cities
    .map((c) => {
      const type = programmatic[main].cities[c.slug] ? main : programmatic[main === "alternance" ? "stage" : "alternance"].cities[c.slug] ? (main === "alternance" ? "stage" : "alternance") : null;
      // Le compteur affiché est celui de l'entreprise dans cette ville, pas le total de la ville.
      return type ? { href: `/${type}/${c.slug}`, label: `${type === "alternance" ? "Alternance" : "Stage"} ${cityPhrase(c.label)}`, count: c.count } : null;
    })
    .filter((l): l is SegmentLink => l !== null);
  const metierLinks: SegmentLink[] = company.metiers
    .filter((m) => programmatic[main].metiers[m.slug])
    .map((m) => ({ href: `/${main}/${m.slug}`, label: `${main === "alternance" ? "Alternance" : "Stage"} ${m.label}`, count: m.count }));

  const topMetier = company.metiers[0]?.slug;
  const related = Object.values(index.companies)
    .filter((c) => c.slug !== company.slug && topMetier && c.metiers[0]?.slug === topMetier)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((c) => ({ href: `/entreprises/${c.slug}`, label: c.label, count: c.count }));

  const faq = [
    {
      q: `Combien d'offres d'alternance et de stage chez ${company.label} ?`,
      a: `${n(company.count, "offre active", "offres actives")} en ce moment : ${split}. La liste est mise à jour chaque jour.`,
    },
    ...(topCities.length > 0
      ? [{ q: `Dans quelles villes ${company.label} recrute-t-il ?`, a: `Principalement ${company.cities.slice(0, 5).map((c) => `${c.label} (${n(c.count, "offre")})`).join(", ")}.` }]
      : []),
    ...(company.metiers.length > 0
      ? [{ q: `Quels postes ${company.label} propose-t-il ?`, a: `Surtout en ${company.metiers.slice(0, 4).map((m) => m.label).join(", ")}.` }]
      : []),
    {
      q: `Comment postuler chez ${company.label} ?`,
      a: `Ouvre une offre ci-dessus puis clique sur « Postuler à cette offre » : tu es redirigé vers l'annonce d'origine. Prépare un CV et une lettre adaptés à chaque poste, ça change tout.`,
    },
  ];

  return {
    company,
    path: `/entreprises/${company.slug}`,
    h1,
    title: `${h1} : ${n(company.count, "offre")}`,
    description: `${n(company.count, "offre")} chez ${company.label} (${split})${topCities.length ? ` à ${topCities.join(", ")}` : ""}. Métiers, villes, salaires : tout pour postuler. Mis à jour chaque jour.`,
    indexable: company.count >= INDEXABLE_MIN_OFFERS,
    paragraphs,
    faq,
    cityLinks,
    metierLinks,
    related,
  };
}

export async function getCompaniesHub(limit = 150) {
  const index = await getCompanyIndex();
  const companies = Object.values(index.companies)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit)
    .map((c) => ({ href: `/entreprises/${c.slug}`, label: c.label, count: c.count }));
  return { index, companies, total: Object.keys(index.companies).length };
}
