import { unstable_cache } from "next/cache";
import { CITY_COORDINATES } from "@/lib/seo/cityCoordinates";
import { normalizeCityKey, slugify } from "@/lib/offers/segments";
import { profileDepartement } from "@/lib/matching/score";
import { isDepartmentLocation } from "@/lib/onboarding/options";

// Coordonnées de la ville d'un élève (18/11) : géocodeur public de l'IGN
// (data.geopf.fr, ex-api-adresse, gratuit, sans clé), gardé 30 jours par
// ville ; à défaut, la liste des grandes villes de Stageio.

export type CityPoint = { lat: number; lon: number; departement: string | null; label: string };

const geocode = unstable_cache(
  async (city: string): Promise<CityPoint | null> => {
    const url = `https://data.geopf.fr/geocodage/search?q=${encodeURIComponent(city)}&type=municipality&limit=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6_000) });
    if (!res.ok) throw new Error(`géocodage : HTTP ${res.status}`);
    const data = (await res.json()) as { features?: { geometry?: { coordinates?: [number, number] }; properties?: { depcode?: string; name?: string } }[] };
    const f = data.features?.[0];
    const c = f?.geometry?.coordinates;
    if (!c) return null;
    return { lon: c[0], lat: c[1], departement: f?.properties?.depcode ?? null, label: f?.properties?.name ?? city };
  },
  ["school-geocode-v1"],
  { revalidate: 30 * 86_400 },
);

export async function cityPoint(city: string | null | undefined): Promise<CityPoint | null> {
  const c = city?.trim();
  if (!c || isDepartmentLocation(c)) return null;
  const known = CITY_COORDINATES[slugify(normalizeCityKey(c))];
  if (known) return { lat: known[0], lon: known[1], departement: profileDepartement(c), label: c };
  try {
    return await geocode(c);
  } catch (err) {
    console.error("stages scolaires : géocodage impossible", err instanceof Error ? err.message : err);
    return null;
  }
}
