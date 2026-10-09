import { fetchOfferSitemapEntries } from "@/lib/offers/sitemapOffers";
import { getProgrammaticIndex, INDEXABLE_MIN_OFFERS } from "@/lib/seo/programmaticIndex";
import { getCompanyIndex } from "@/lib/seo/companyIndex";
import { GUIDES } from "@/lib/guides/guidesData";
import { departementPath } from "@/lib/seo/programmaticPage";
import { regionPath } from "@/lib/seo/regionPage";
import type { ContractType } from "@/types/database";

// Pages dont le contenu bouge chaque jour (compteurs, dernières offres).
const STATIC_PATHS = [
  "/",
  "/a-propos",
  "/offres",
  "/offres/alternance",
  "/offres/stage",
  "/alternance",
  "/alternance/urgent",
  "/stage",
  "/guides",
  "/outils",
  "/outils/simulateur-salaire-alternance",
  "/outils/lettre-de-motivation-alternance",
  "/outils/lettre-de-motivation-stage",
  "/outils/cv-alternance",
  "/outils/cv-stage",
  "/barometre-alternance-stage",
  "/entreprises",
  "/inscription",
];

type IsNew = (date?: string | null) => boolean;

async function companyPaths(isNew: IsNew): Promise<string[]> {
  const index = await getCompanyIndex();
  return Object.values(index.companies)
    .filter((c) => c.count >= INDEXABLE_MIN_OFFERS && isNew(c.latest))
    .map((c) => `/entreprises/${c.slug}`);
}

async function programmaticPaths(type: ContractType, isNew: IsNew): Promise<string[]> {
  const index = await getProgrammaticIndex(type);
  // Indexable ET une offre publiée depuis le dernier envoi : IndexNow ne doit
  // recevoir que des pages qui ont réellement changé.
  const keep = (stats: { count: number; latest: string | null }) => stats.count >= INDEXABLE_MIN_OFFERS && isNew(stats.latest);
  return [
    ...Object.values(index.metiers).filter(keep).map((m) => `/${type}/${m.slug}`),
    ...Object.values(index.cities).filter(keep).map((c) => `/${type}/${c.slug}`),
    ...Object.values(index.combos).filter(keep).map((c) => `/${type}/${c.metier}/${c.city}`),
    ...Object.values(index.departements).filter(keep).map((d) => departementPath(type, d.slug, null)),
    ...Object.values(index.depCombos)
      .filter((c) => keep(c) && index.departements[c.dep])
      .map((c) => departementPath(type, index.departements[c.dep].slug, c.metier)),
    ...Object.values(index.regions).filter(keep).map((r) => regionPath(type, r.slug, null)),
    ...Object.values(index.regionCombos).filter(keep).map((c) => regionPath(type, c.region, c.metier)),
  ];
}

// Toutes les URLs indexables du site, ou seulement ce qui a changé depuis
// `since` : les hubs sont toujours renvoyés ; les pages métier / ville /
// territoire / entreprise seulement si une offre y a été publiée depuis
// `since` ; les offres arrivées depuis `since`, les guides nouveaux ou mis à jour.
export async function collectIndexNowPaths(since?: Date): Promise<string[]> {
  const isNew: IsNew = (date) => !since || (Boolean(date) && new Date(date!).getTime() >= since.getTime());
  const [alternance, stage, companies, offersAlternance, offersStage] = await Promise.all([
    programmaticPaths("alternance", isNew),
    programmaticPaths("stage", isNew),
    companyPaths(isNew),
    fetchOfferSitemapEntries("alternance"),
    fetchOfferSitemapEntries("stage"),
  ]);
  return [
    ...STATIC_PATHS,
    ...GUIDES.filter((guide) => isNew(guide.updatedAt)).map((guide) => `/guides/${guide.slug}`),
    ...alternance,
    ...stage,
    ...companies,
    // Arrivée sur Stageio, pas date de publication : une offre publiée il y
    // a une semaine mais importée cette nuit est une URL nouvelle.
    ...[...offersAlternance, ...offersStage].filter((entry) => isNew(entry.createdAt)).map((entry) => entry.path),
  ];
}
