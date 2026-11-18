import { unstable_cache } from "next/cache";
import { CITY_COORDINATES } from "@/lib/seo/cityCoordinates";
import { normalizeCityKey, slugify, titleCase } from "@/lib/offers/segments";
import { profileDepartement } from "@/lib/matching/score";
import { isDepartmentLocation } from "@/lib/onboarding/options";

// Entreprises proches pour un stage scolaire (18/11) : annuaire public des
// entreprises (recherche-entreprises.api.gouv.fr, gratuit, sans clé, données
// de l'Insee). On ne garde que les établissements ouverts qui ont des
// salariés, dans les activités qu'un élève peut découvrir. Pas d'e-mail dans
// ces données : l'élève dépose ou envoie sa lettre lui-même.

const API = "https://recherche-entreprises.api.gouv.fr";

export type SchoolSector = { id: string; label: string; emoji: string; naf: Record<string, string> };

// Codes NAF (rév. 2) et libellés courts montrés à l'élève.
export const SCHOOL_SECTORS: SchoolSector[] = [
  { id: "commerce", label: "Magasins et commerce", emoji: "🛍️", naf: { "47.71Z": "Magasin de vêtements", "47.64Z": "Magasin de sport", "47.61Z": "Librairie", "47.65Z": "Magasin de jeux et jouets", "47.11F": "Grande surface" } },
  { id: "restauration", label: "Restaurants", emoji: "🍽️", naf: { "56.10A": "Restaurant", "56.10C": "Restauration rapide" } },
  { id: "boulangerie", label: "Boulangerie et pâtisserie", emoji: "🥐", naf: { "10.71C": "Boulangerie-pâtisserie", "10.71D": "Pâtisserie" } },
  { id: "sante", label: "Santé", emoji: "🩺", naf: { "47.73Z": "Pharmacie", "86.21Z": "Cabinet médical", "86.23Z": "Cabinet dentaire", "86.90E": "Kinésithérapie, soins" } },
  { id: "animaux", label: "Animaux", emoji: "🐾", naf: { "75.00Z": "Clinique vétérinaire" } },
  { id: "beaute", label: "Coiffure et beauté", emoji: "💇", naf: { "96.02A": "Salon de coiffure", "96.02B": "Institut de beauté" } },
  { id: "auto", label: "Garage et automobile", emoji: "🚗", naf: { "45.20A": "Garage automobile", "45.11Z": "Concession automobile" } },
  { id: "batiment", label: "Bâtiment et artisanat", emoji: "🔨", naf: { "43.21A": "Électricien", "43.22A": "Plombier, chauffagiste", "43.32A": "Menuisier", "43.34Z": "Peintre en bâtiment" } },
  { id: "informatique", label: "Informatique et numérique", emoji: "💻", naf: { "62.01Z": "Développement informatique", "62.02A": "Conseil en informatique" } },
  { id: "communication", label: "Communication et pub", emoji: "📣", naf: { "73.11Z": "Agence de publicité", "70.21Z": "Relations publiques, communication" } },
  { id: "droit", label: "Droit et comptabilité", emoji: "⚖️", naf: { "69.10Z": "Cabinet d'avocats, notaire", "69.20Z": "Cabinet comptable" } },
  { id: "architecture", label: "Architecture", emoji: "📐", naf: { "71.11Z": "Cabinet d'architecte" } },
  { id: "banque", label: "Banque et assurance", emoji: "🏦", naf: { "64.19Z": "Banque", "66.22Z": "Agence d'assurance" } },
  { id: "immobilier", label: "Immobilier", emoji: "🏠", naf: { "68.31Z": "Agence immobilière" } },
  { id: "hotellerie", label: "Hôtels", emoji: "🛎️", naf: { "55.10Z": "Hôtel" } },
  { id: "enfance", label: "Petite enfance", emoji: "🧸", naf: { "88.91A": "Crèche" } },
  { id: "sport", label: "Sport", emoji: "⚽", naf: { "93.12Z": "Club de sport", "93.13Z": "Salle de sport" } },
  { id: "nature", label: "Fleurs et espaces verts", emoji: "🌷", naf: { "47.76Z": "Fleuriste, jardinerie", "81.30Z": "Paysagiste" } },
];

export function schoolSector(id: string): SchoolSector | undefined {
  return SCHOOL_SECTORS.find((s) => s.id === id);
}

export type SchoolCompany = { siret: string; name: string; activity: string; address: string; city: string | null };

type Zone = { lat: number; lon: number; label: string } | { departement: string; label: string };

export function schoolZone(city: string | null | undefined): Zone | null {
  const c = city?.trim();
  if (!c) return null;
  if (!isDepartmentLocation(c)) {
    const coords = CITY_COORDINATES[slugify(normalizeCityKey(c))];
    if (coords) return { lat: coords[0], lon: coords[1], label: c };
  }
  const departement = profileDepartement(c);
  return departement ? { departement, label: c } : null;
}

type ApiEtablissement = {
  siret?: string;
  adresse?: string;
  libelle_commune?: string;
  activite_principale?: string;
  caractere_employeur?: string | null;
  etat_administratif?: string;
  liste_enseignes?: string[] | null;
  nom_commercial?: string | null;
};
type ApiResult = { nom_complet?: string; matching_etablissements?: ApiEtablissement[] };

function cleanName(raw: string): string {
  const name = raw.replace(/\s*\(.*?\)\s*$/, "").trim();
  return name.length > 3 && name === name.toUpperCase() ? titleCase(name.toLowerCase()) : name;
}

/** Transforme une réponse de l'annuaire en entreprises à contacter (une par adresse). */
export function toCompanies(results: ApiResult[], labels: Record<string, string>): SchoolCompany[] {
  const out: SchoolCompany[] = [];
  const seen = new Set<string>();
  for (const r of results) {
    for (const e of r.matching_etablissements ?? []) {
      if (!e.siret || seen.has(e.siret)) continue;
      if (e.etat_administratif && e.etat_administratif !== "A") continue;
      // « N » : l'Insee sait que l'établissement n'a pas de salarié.
      if (e.caractere_employeur === "N") continue;
      const activity = labels[e.activite_principale ?? ""];
      if (!activity) continue;
      const brand = e.liste_enseignes?.find((x) => x?.trim()) || e.nom_commercial || r.nom_complet || "";
      if (!brand.trim() || !e.adresse) continue;
      seen.add(e.siret);
      out.push({
        siret: e.siret,
        name: cleanName(brand),
        activity,
        address: titleCase(e.adresse.toLowerCase()),
        city: e.libelle_commune ? titleCase(e.libelle_commune.toLowerCase()) : null,
      });
    }
  }
  return out;
}

async function fetchJson(url: string): Promise<{ results?: ApiResult[] }> {
  const res = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8_000) });
  if (!res.ok) throw new Error(`annuaire des entreprises : HTTP ${res.status}`);
  return res.json();
}

const cachedSearch = unstable_cache(
  async (sectorId: string, zoneKey: string): Promise<SchoolCompany[]> => {
    const sector = schoolSector(sectorId);
    if (!sector) return [];
    const zone = JSON.parse(zoneKey) as Zone;
    const params = new URLSearchParams({
      activite_principale: Object.keys(sector.naf).join(","),
      etat_administratif: "A",
      minimal: "true",
      include: "matching_etablissements",
      per_page: "25",
    });
    const url =
      "lat" in zone
        ? `${API}/near_point?${params}&lat=${zone.lat}&long=${zone.lon}&radius=8`
        : `${API}/search?${params}&departement=${encodeURIComponent(zone.departement)}`;
    const data = await fetchJson(url);
    return toCompanies(data.results ?? [], sector.naf).slice(0, 30);
  },
  ["school-stage-companies-v1"],
  { revalidate: 24 * 3600 },
);

export type SchoolCompaniesResult = { status: "ok"; companies: SchoolCompany[]; zone: string } | { status: "no_city" | "error" };

export async function loadSchoolCompanies(city: string | null | undefined, sectorId: string): Promise<SchoolCompaniesResult> {
  const zone = schoolZone(city);
  if (!zone) return { status: "no_city" };
  try {
    return { status: "ok", companies: await cachedSearch(sectorId, JSON.stringify(zone)), zone: zone.label };
  } catch (err) {
    console.error("stages scolaires : annuaire des entreprises indisponible", err instanceof Error ? err.message : err);
    return { status: "error" };
  }
}
