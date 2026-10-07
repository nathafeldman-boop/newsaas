import { fetchOfferSitemapEntries } from "@/lib/offers/sitemapOffers";
import { getProgrammaticIndex, INDEXABLE_MIN_OFFERS } from "@/lib/seo/programmaticIndex";
import { getCompanyIndex } from "@/lib/seo/companyIndex";
import { GUIDES } from "@/lib/guides/guidesData";
import type { ContractType } from "@/types/database";

// Pages dont le contenu bouge chaque jour (compteurs, dernières offres).
const STATIC_PATHS = [
  "/",
  "/offres",
  "/offres/alternance",
  "/offres/stage",
  "/alternance",
  "/stage",
  "/guides",
  "/outils/simulateur-salaire-alternance",
  "/barometre-alternance-stage",
  "/entreprises",
  "/inscription",
];

async function companyPaths(): Promise<string[]> {
  const index = await getCompanyIndex();
  return Object.values(index.companies)
    .filter((c) => c.count >= INDEXABLE_MIN_OFFERS)
    .map((c) => `/entreprises/${c.slug}`);
}

async function programmaticPaths(type: ContractType): Promise<string[]> {
  const index = await getProgrammaticIndex(type);
  const keep = (count: number) => count >= INDEXABLE_MIN_OFFERS;
  return [
    ...Object.values(index.metiers).filter((m) => keep(m.count)).map((m) => `/${type}/${m.slug}`),
    ...Object.values(index.cities).filter((c) => keep(c.count)).map((c) => `/${type}/${c.slug}`),
    ...Object.values(index.combos).filter((c) => keep(c.count)).map((c) => `/${type}/${c.metier}/${c.city}`),
  ];
}

// Toutes les URLs indexables du site, ou seulement ce qui a changé depuis
// `since` : les hubs, pages métier/ville et pages entreprise changent chaque
// jour (nouvelles offres, compteurs) et sont toujours renvoyées ; les offres
// et les guides seulement s'ils sont nouveaux ou mis à jour depuis `since`.
export async function collectIndexNowPaths(since?: Date): Promise<string[]> {
  const [alternance, stage, companies, offersAlternance, offersStage] = await Promise.all([
    programmaticPaths("alternance"),
    programmaticPaths("stage"),
    companyPaths(),
    fetchOfferSitemapEntries("alternance"),
    fetchOfferSitemapEntries("stage"),
  ]);
  const isNew = (date?: string | null) =>
    !since || (Boolean(date) && new Date(date!).getTime() >= since.getTime());
  return [
    ...STATIC_PATHS,
    ...GUIDES.filter((guide) => isNew(guide.updatedAt)).map((guide) => `/guides/${guide.slug}`),
    ...alternance,
    ...stage,
    ...companies,
    ...[...offersAlternance, ...offersStage].filter((entry) => isNew(entry.lastModified)).map((entry) => entry.path),
  ];
}
