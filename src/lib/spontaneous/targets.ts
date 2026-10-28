import { unstable_cache } from "next/cache";
import type { createAdminClient } from "@/lib/supabase/admin";
import { LbaError, lbaApiKey, searchLbaRecruiters, type LbaRecruiter } from "@/lib/laBonneAlternance/client";
import { CITY_COORDINATES } from "@/lib/seo/cityCoordinates";
import { normalizeCityKey, slugify, titleCase } from "@/lib/offers/segments";
import { profileDepartement } from "@/lib/matching/score";
import { isDepartmentLocation } from "@/lib/onboarding/options";
import { fetchAllRows } from "@/lib/supabase/public";
import { romesForProfile } from "@/lib/spontaneous/romes";
import type { Profile } from "@/types/database";

// Candidatures spontanées (28/10, Nathan : « qu'ils aient juste besoin de
// postuler ») : les entreprises proches de l'étudiant qui recrutent des
// alternants dans son métier sans avoir publié d'offre (La bonne alternance,
// service public), et à qui l'API sait transmettre une candidature. Liste
// gardée 12 h par métier et par zone (60 recherches par minute pour tout
// Stageio). Abonnés seulement : rien ne change avant le paiement.

export const SPONTANEOUS_EVENT = "spontaneous_application_sent";
/** Envois à la main par jour (heure de Paris), toutes formules. */
export const SPONTANEOUS_DAILY_LIMIT = 30;
/** Envois automatiques par jour pour Stageio Auto. */
export const AUTO_SPONTANEOUS_PER_DAY = 20;

export type SpontaneousTarget = {
  recipientId: string;
  company: string;
  activity: string | null;
  city: string | null;
  size: string | null;
  website: string | null;
};

type Zone = { latitude: number; longitude: number; radius: number; label: string } | { departement: string; label: string };

// Rayon selon la mobilité déclarée : on reste près de chez l'étudiant.
function radiusFor(mobility: string | null): number {
  if (mobility === "Sur place uniquement") return 20;
  if (mobility === "Mobile dans la région" || mobility === "Mobile en France") return 50;
  return 30;
}

export function zoneFor(profile: Pick<Profile, "city" | "mobility">): Zone | null {
  const city = profile.city?.trim();
  if (!city) return null;
  if (!isDepartmentLocation(city)) {
    const coords = CITY_COORDINATES[slugify(normalizeCityKey(city))];
    if (coords) return { latitude: coords[0], longitude: coords[1], radius: radiusFor(profile.mobility), label: city };
  }
  const departement = profileDepartement(city);
  return departement ? { departement, label: city } : null;
}

// « 12 RUE DE LA PAIX 69003 LYON » → « Lyon ».
export function cityOfAddress(address: string | null | undefined): string | null {
  const match = [...(address ?? "").replace(/,?\s*France\s*$/i, "").matchAll(/\b\d{5}\s*,?\s*([^\d,]+)/g)].pop();
  const city = match?.[1]?.replace(/\s+cedex.*$/i, "").trim();
  return city ? titleCase(city.toLowerCase()) : null;
}

export function toTarget(recruiter: LbaRecruiter): SpontaneousTarget | null {
  const recipientId = recruiter.apply?.recipient_id?.trim();
  const w = recruiter.workplace;
  const company = (w?.brand || w?.name || w?.legal_name || "").trim();
  if (!recipientId || !company) return null;
  return {
    recipientId,
    company: company.length > 3 && company === company.toUpperCase() ? titleCase(company.toLowerCase()) : company,
    activity: w.domain?.naf?.label?.trim() || null,
    city: cityOfAddress(w.location?.address),
    size: w.size?.trim() || null,
    website: w.website?.trim() || null,
  };
}

async function search(romes: string[], zone: Zone): Promise<LbaRecruiter[]> {
  const where = "departement" in zone ? { departement: zone.departement } : { latitude: zone.latitude, longitude: zone.longitude, radius: zone.radius };
  try {
    return await searchLbaRecruiters({ romes, ...where });
  } catch (err) {
    // Un code refusé par l'API fait échouer toute la recherche : on retente
    // avec le premier code seul.
    if (err instanceof LbaError && err.status === 400 && romes.length > 1) return searchLbaRecruiters({ romes: romes.slice(0, 1), ...where });
    throw err;
  }
}

const cachedTargets = unstable_cache(
  async (romesKey: string, zoneKey: string): Promise<SpontaneousTarget[]> => {
    const zone = JSON.parse(zoneKey) as Zone;
    const seen = new Set<string>();
    const targets: SpontaneousTarget[] = [];
    for (const recruiter of await search(romesKey.split(","), zone)) {
      const target = toTarget(recruiter);
      if (target && !seen.has(target.recipientId)) {
        seen.add(target.recipientId);
        targets.push(target);
      }
    }
    return targets;
  },
  ["lba-spontaneous-targets-v1"],
  { revalidate: 12 * 3600 },
);

export type TargetsResult =
  | { status: "ok"; targets: SpontaneousTarget[]; zone: string; romes: string[] }
  | { status: "no_job" | "no_city" | "off" | "error" };

export async function loadTargets(profile: Pick<Profile, "target_jobs" | "city" | "mobility">): Promise<TargetsResult> {
  if (!lbaApiKey()) return { status: "off" };
  const romes = romesForProfile(profile);
  if (romes.length === 0) return { status: "no_job" };
  const zone = zoneFor(profile);
  if (!zone) return { status: "no_city" };
  try {
    return { status: "ok", targets: await cachedTargets(romes.join(","), JSON.stringify(zone)), zone: zone.label, romes };
  } catch (err) {
    console.error("spontanees: recherche La bonne alternance impossible", err instanceof Error ? err.message : err);
    return { status: "error" };
  }
}

type Admin = ReturnType<typeof createAdminClient>;

/** Entreprises déjà contactées en spontané par ce compte (recipient_id) et envois depuis `sinceIso` (à la main, automatiques). */
export async function contactedBy(admin: Admin, userId: string, sinceIso: string): Promise<{ ids: Set<string>; manual: number; auto: number }> {
  const rows = await fetchAllRows<{ metadata: Record<string, unknown> | null; created_at: string }>((from, to) =>
    admin.from("user_events").select("metadata, created_at").eq("user_id", userId).eq("event_type", SPONTANEOUS_EVENT).order("created_at").range(from, to),
  );
  const ids = new Set<string>();
  let manual = 0;
  let auto = 0;
  for (const r of rows) {
    const id = r.metadata?.recipientId;
    if (typeof id === "string") ids.add(id);
    if (r.created_at < sinceIso) continue;
    if (r.metadata?.via === "auto") auto++;
    else manual++;
  }
  return { ids, manual, auto };
}
