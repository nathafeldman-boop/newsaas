import { unstable_cache } from "next/cache";
import { CITY_COORDINATES } from "@/lib/seo/cityCoordinates";
import { titleCase } from "@/lib/offers/segments";
import { fetchE1S, type E1SOffer } from "@/lib/schoolStage/schoolOffers";
import { loadSchoolCompanies, SCHOOL_SECTORS, type SchoolCompany } from "@/lib/schoolStage/companies";
import type { SchoolStageLevel } from "@/types/database";

// Pages « stage de 3e à Lyon », « stage de seconde à Nantes »... (25/11,
// Nathan : « on devrait baser notre stratégie sur le SEO, fais-nous
// d'autres pages »). Une page par grande ville de cityCoordinates.ts, avec
// uniquement des données réelles, relues une fois par jour :
// - les offres publiées sur 1élève1stage (3e et seconde) dans un rayon de
//   25 km (plateforme de l'État, licence Etalab 2.0, source citée) ;
// - des entreprises ouvertes avec salariés près du centre-ville (annuaire
//   des entreprises, Insee), présentées comme candidatures spontanées.
// Rien n'est écrit en base depuis ces pages.

// La Défense n'est pas une commune : pas de page.
const EXCLUDED = new Set(["la-defense"]);

export const SCHOOL_CITY_SLUGS = Object.keys(CITY_COORDINATES).filter((s) => !EXCLUDED.has(s));

// 1élève1stage : grade_id 1 = seconde, 2 = troisième (voir schoolOffers.ts).
const GRADE: Partial<Record<SchoolStageLevel, number>> = { seconde: 1, "3e": 2 };

// Secteurs montrés sur la page : ceux qu'un élève découvre le plus souvent.
export const CITY_PAGE_SECTORS = ["commerce", "restauration", "sante", "informatique", "boulangerie", "beaute"];

export type SchoolCityOffer = { id: string; title: string; company: string; city: string | null; weeks: string | null; dates: string | null; url: string | null };

export type SchoolCityPage = {
  level: SchoolStageLevel;
  slug: string;
  label: string;
  departement: string | null;
  /** null : 1élève1stage ne publie pas pour cette classe, ou n'a pas répondu. */
  offers: SchoolCityOffer[] | null;
  sectors: { id: string; label: string; emoji: string; companies: SchoolCompany[] }[];
  checkedAt: string;
};

// Nom officiel avec accents (« Orléans », « Besançon ») et département :
// géocodeur public de l'IGN, recherche centrée sur la ville, gardé 30 jours.
const officialName = unstable_cache(
  async (slug: string): Promise<{ name: string; departement: string | null } | null> => {
    const [lat, lon] = CITY_COORDINATES[slug];
    const q = encodeURIComponent(slug.replace(/-/g, " "));
    const res = await fetch(`https://data.geopf.fr/geocodage/search?q=${q}&type=municipality&limit=1&lat=${lat}&lon=${lon}`, {
      signal: AbortSignal.timeout(6_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { features?: { properties?: { name?: string; depcode?: string } }[] };
    const p = data.features?.[0]?.properties;
    // On ne garde le nom que s'il correspond bien au slug de la page.
    return p?.name && slugOf(p.name) === slug ? { name: p.name, departement: p.depcode ?? null } : null;
  },
  ["school-city-name-v2"],
  { revalidate: 30 * 86_400 },
);

function slugOf(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function schoolCity(slug: string): Promise<{ name: string; departement: string | null }> {
  const fallback = { name: titleCase(slug.replace(/-/g, " ")), departement: null };
  try {
    return (await officialName(slug)) ?? fallback;
  } catch {
    return fallback;
  }
}

const cityOffers = unstable_cache(
  async (slug: string, grade: number): Promise<SchoolCityOffer[]> => {
    const [lat, lon] = CITY_COORDINATES[slug];
    const list: E1SOffer[] = await fetchE1S({ lat, lon, departement: null, label: slug }, grade);
    const seen = new Set<number>();
    return list
      .filter((o) => o.id && o.title?.trim() && !seen.has(o.id) && seen.add(o.id))
      .map((o) => ({
        id: String(o.id),
        title: o.title!.trim().charAt(0).toUpperCase() + o.title!.trim().slice(1),
        company: (o.can_read_employer_name !== false && o.employer_name?.trim()) || "Structure d'accueil",
        city: o.city?.trim() ? titleCase(o.city.trim().toLowerCase()) : null,
        weeks: o.available_weeks_count?.trim() || null,
        dates: o.date_start && o.date_end ? `du ${o.date_start.trim()} au ${o.date_end.trim()}` : null,
        url: o.link ? `https://1eleve1stage.education.gouv.fr${o.link.split("?")[0]}` : null,
      }));
  },
  ["school-city-offers-v1"],
  { revalidate: 24 * 3600 },
);

export async function loadSchoolCityPage(level: SchoolStageLevel, slug: string): Promise<SchoolCityPage | null> {
  if (!SCHOOL_CITY_SLUGS.includes(slug)) return null;
  const grade = GRADE[level];
  const [city, offers, ...sectorResults] = await Promise.all([
    schoolCity(slug),
    grade
      ? cityOffers(slug, grade).catch((err) => {
          console.error("pages stage scolaire : 1élève1stage indisponible", err instanceof Error ? err.message : err);
          return null;
        })
      : Promise.resolve(null),
    ...CITY_PAGE_SECTORS.map((id) => loadSchoolCompanies(slug, id)),
  ]);
  const sectors = CITY_PAGE_SECTORS.map((id, i) => {
    const s = SCHOOL_SECTORS.find((x) => x.id === id)!;
    const r = sectorResults[i];
    return { id, label: s.label, emoji: s.emoji, companies: r.status === "ok" ? r.companies.slice(0, 6) : [] };
  }).filter((s) => s.companies.length > 0);
  return { level, slug, label: city.name, departement: city.departement, offers, sectors, checkedAt: new Date().toISOString() };
}

/** Villes proches (même liste), pour le maillage interne. */
export function nearbySchoolCities(slug: string, max = 8): string[] {
  const here = CITY_COORDINATES[slug];
  if (!here) return [];
  return SCHOOL_CITY_SLUGS.filter((s) => s !== slug)
    .map((s) => ({ s, d: Math.hypot(CITY_COORDINATES[s][0] - here[0], (CITY_COORDINATES[s][1] - here[1]) * Math.cos((here[0] * Math.PI) / 180)) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, max)
    .map((x) => x.s);
}
