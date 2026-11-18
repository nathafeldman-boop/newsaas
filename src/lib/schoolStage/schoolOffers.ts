import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { titleCase } from "@/lib/offers/segments";
import { cityPoint, type CityPoint } from "@/lib/schoolStage/geo";
import { SCHOOL_SECTORS, toCompanies, type SchoolSector } from "@/lib/schoolStage/companies";
import type { SchoolStageLevel } from "@/types/database";

// Paquet des élèves (18/11, Nathan : « l'onboarding de base, juste au lieu
// des offres d'alternance, des offres de stage de 3e… et on les fait
// payer »). Deux sources, rangées dans offers (contract_type stage_scolaire)
// pour passer par le même swipe, les mêmes favoris et le même paywall :
// 1. 1élève1stage : vraies offres de 3e et de seconde de la plateforme de
//    l'État (licence Etalab 2.0 : source citée sur chaque offre). On postule
//    là-bas, avec ÉduConnect : Stageio prépare la lettre et ouvre l'offre.
// 2. Annuaire des entreprises : entreprises proches sans offre publiée,
//    présentées comme « candidature spontanée » (jamais comme une offre).
// Rafraîchi à la demande, par ville et par classe, gardé 12 h.

const E1S = "https://1eleve1stage.education.gouv.fr";
const ANNUAIRE = "https://recherche-entreprises.api.gouv.fr";
const RADIUS_KM = 25;
const QUALITY = 70;

type E1SOffer = {
  id: number;
  title?: string;
  description?: string;
  employer_name?: string;
  link?: string;
  city?: string;
  date_start?: string;
  date_end?: string;
  sector?: string;
  fits_for_seconde?: boolean;
  fits_for_troisieme_or_quatrieme?: boolean;
  available_weeks_count?: string;
  can_read_employer_name?: boolean;
};

// grade_id de 1élève1stage (lus sur la plateforme le 18/11) : 1 seconde, 2 troisième.
const GRADE: Partial<Record<SchoolStageLevel, number>> = { seconde: 1, "3e": 2 };

// Secteurs choisis à l'onboarding (liste SECTORS) → secteurs de l'annuaire.
const SECTOR_MAP: Record<string, string> = {
  Commerce: "commerce",
  Distribution: "commerce",
  "Grande distribution": "commerce",
  Mode: "commerce",
  Restauration: "restauration",
  "Restauration collective": "restauration",
  "Boulangerie et pâtisserie": "boulangerie",
  Santé: "sante",
  Pharmacie: "sante",
  Kinésithérapie: "sante",
  Coiffure: "beaute",
  "Beauté et esthétique": "beaute",
  Automobile: "auto",
  Mécanique: "auto",
  BTP: "batiment",
  Électricité: "batiment",
  "Plomberie et chauffage": "batiment",
  "Menuiserie et ébénisterie": "batiment",
  Artisanat: "batiment",
  Informatique: "informatique",
  Data: "informatique",
  "Jeux vidéo": "informatique",
  Cybersécurité: "informatique",
  Communication: "communication",
  Marketing: "communication",
  Publicité: "communication",
  "Juridique et droit": "droit",
  Comptabilité: "droit",
  Notariat: "droit",
  Architecture: "architecture",
  Banque: "banque",
  Assurance: "banque",
  Finance: "banque",
  Immobilier: "immobilier",
  Hôtellerie: "hotellerie",
  "Petite enfance": "enfance",
  Sport: "sport",
  Paysagisme: "nature",
  Horticulture: "nature",
};
const DEFAULT_SECTORS = ["commerce", "restauration", "sante", "informatique"];

export function schoolSectorsFor(profileSectors: string[]): SchoolSector[] {
  const ids = [...new Set(profileSectors.map((s) => SECTOR_MAP[s]).filter(Boolean))];
  return (ids.length > 0 ? ids : DEFAULT_SECTORS).slice(0, 4).map((id) => SCHOOL_SECTORS.find((s) => s.id === id)!).filter(Boolean);
}

export type SchoolOfferRow = {
  source: "1eleve1stage" | "annuaire_entreprises";
  external_id: string;
  title: string;
  company: string;
  location: string;
  contract_type: "stage_scolaire";
  sector: string | null;
  description: string;
  duration: string | null;
  apply_url: string | null;
  source_url: string | null;
  school_levels: string[];
  quality_score: number;
  is_active: boolean;
};

function place(city: string | null | undefined, point: CityPoint): string {
  const c = city?.trim() ? titleCase(city.trim().toLowerCase()) : point.label;
  return point.departement ? `${point.departement} - ${c}` : c;
}

/** Offre 1élève1stage → ligne offers. null si l'offre ne sert à aucune des classes suivies. */
export function e1sToRow(o: E1SOffer, point: CityPoint): SchoolOfferRow | null {
  const levels = [...(o.fits_for_troisieme_or_quatrieme ? ["3e"] : []), ...(o.fits_for_seconde ? ["seconde"] : [])];
  if (!o.id || !o.title?.trim() || levels.length === 0) return null;
  const company = (o.can_read_employer_name !== false && o.employer_name?.trim()) || "Structure d'accueil";
  const dates = o.date_start && o.date_end ? `du ${o.date_start} au ${o.date_end}` : null;
  const link = o.link ? `${E1S}${o.link.split("?")[0]}` : null;
  return {
    source: "1eleve1stage",
    external_id: String(o.id),
    title: o.title.trim().charAt(0).toUpperCase() + o.title.trim().slice(1),
    company,
    location: place(o.city, point),
    contract_type: "stage_scolaire",
    sector: o.sector?.trim() || null,
    description: `${(o.description ?? "").replace(/\r/g, "").trim()}\n\nOffre publiée sur 1élève1stage, la plateforme du ministère de l'Éducation nationale. Pour postuler, tu valides ta candidature sur 1élève1stage avec ton compte ÉduConnect : Stageio te prépare ta lettre.`.trim(),
    duration: [o.available_weeks_count, dates].filter(Boolean).join(", ") || null,
    apply_url: link,
    source_url: link,
    school_levels: levels,
    quality_score: QUALITY,
    is_active: true,
  };
}

async function fetchE1S(point: CityPoint, grade: number): Promise<E1SOffer[]> {
  const out: E1SOffer[] = [];
  for (let page = 1; page <= 4; page++) {
    const url = `${E1S}/offres-de-stage.json?latitude=${point.lat}&longitude=${point.lon}&radius=${RADIUS_KM * 1000}&grade_id=${grade}&page=${page}`;
    const res = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8_000) });
    if (!res.ok) throw new Error(`1élève1stage : HTTP ${res.status}`);
    const data = (await res.json()) as { internshipOffers?: E1SOffer[]; pageLinks?: { nextPage?: number | null } };
    out.push(...(data.internshipOffers ?? []));
    if (!data.pageLinks?.nextPage) break;
  }
  return out;
}

async function fetchCompanies(point: CityPoint, sector: SchoolSector): Promise<SchoolOfferRow[]> {
  const params = new URLSearchParams({
    activite_principale: Object.keys(sector.naf).join(","),
    etat_administratif: "A",
    minimal: "true",
    include: "matching_etablissements",
    per_page: "25",
  });
  const res = await fetch(`${ANNUAIRE}/near_point?${params}&lat=${point.lat}&long=${point.lon}&radius=8`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`annuaire des entreprises : HTTP ${res.status}`);
  const data = (await res.json()) as { results?: Parameters<typeof toCompanies>[0] };
  return toCompanies(data.results ?? [], sector.naf)
    .slice(0, 15)
    .map((c) => ({
      source: "annuaire_entreprises" as const,
      external_id: c.siret,
      title: `Candidature spontanée · ${c.activity}`,
      company: c.name,
      location: place(c.city, point),
      contract_type: "stage_scolaire" as const,
      sector: sector.label,
      description: `${c.name} n'a pas publié d'offre de stage : c'est une entreprise près de chez toi (${c.address}). Beaucoup de stages se trouvent comme ça, en demandant directement. Stageio te prépare une lettre de demande de stage à envoyer ou à déposer en main propre.\n\nSource : annuaire des entreprises (Insee), établissement ouvert avec des salariés.`,
      duration: null,
      apply_url: null,
      source_url: `https://annuaire-entreprises.data.gouv.fr/etablissement/${c.siret}`,
      school_levels: ["3e", "seconde", "premiere", "bac_pro"],
      quality_score: QUALITY - 10,
      is_active: true,
    }));
}

/** Enregistre les lignes : nouvelles insérées, déjà connues marquées « vues aujourd'hui ». */
async function store(rows: SchoolOfferRow[]): Promise<void> {
  if (rows.length === 0) return;
  const admin = createAdminClient();
  const now = new Date().toISOString();
  for (const source of ["1eleve1stage", "annuaire_entreprises"] as const) {
    const mine = rows.filter((r) => r.source === source);
    if (mine.length === 0) continue;
    const { data: known, error } = await admin.from("offers").select("external_id").eq("source", source).in("external_id", mine.map((r) => r.external_id));
    if (error) throw new Error(error.message);
    const knownIds = new Set((known ?? []).map((k) => k.external_id));
    const fresh = mine.filter((r) => !knownIds.has(r.external_id)).map((r) => ({ ...r, published_at: now, last_seen_at: now }));
    if (fresh.length > 0) {
      const { error: insErr } = await admin.from("offers").upsert(fresh as never, { onConflict: "source,external_id", ignoreDuplicates: true });
      if (insErr) throw new Error(insErr.message);
    }
    const seen = mine.filter((r) => knownIds.has(r.external_id)).map((r) => r.external_id);
    if (seen.length > 0) {
      await admin.from("offers").update({ last_seen_at: now, is_active: true }).eq("source", source).in("external_id", seen);
    }
  }
}

const refreshNear = unstable_cache(
  async (pointKey: string, level: SchoolStageLevel, sectorIds: string): Promise<number> => {
    const point = JSON.parse(pointKey) as CityPoint;
    const grade = GRADE[level];
    const sectors = sectorIds.split(",").map((id) => SCHOOL_SECTORS.find((s) => s.id === id)).filter((s): s is SchoolSector => !!s);
    const tasks: Promise<SchoolOfferRow[]>[] = [
      ...(grade ? [fetchE1S(point, grade).then((list) => list.map((o) => e1sToRow(o, point)).filter((r): r is SchoolOfferRow => !!r))] : []),
      ...sectors.map((s) => fetchCompanies(point, s)),
    ];
    const settled = await Promise.allSettled(tasks);
    const rows = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    for (const r of settled) if (r.status === "rejected") console.error("stages scolaires : source indisponible", r.reason instanceof Error ? r.reason.message : r.reason);
    await store(rows);
    return rows.length;
  },
  ["school-offers-refresh-v1"],
  { revalidate: 12 * 3600 },
);

/** Met à jour les offres scolaires autour de l'élève. Jamais bloquant pour le paquet. */
export async function refreshSchoolOffers(profile: { city: string | null; school_stage?: SchoolStageLevel | null; sectors: string[] }): Promise<CityPoint | null> {
  if (!profile.school_stage) return null;
  const point = await cityPoint(profile.city);
  if (!point) return null;
  const sectorIds = schoolSectorsFor(profile.sectors).map((s) => s.id).join(",");
  try {
    await refreshNear(JSON.stringify({ ...point, lat: Number(point.lat.toFixed(3)), lon: Number(point.lon.toFixed(3)) }), profile.school_stage, sectorIds);
  } catch (err) {
    console.error("stages scolaires : mise à jour impossible", err instanceof Error ? err.message : err);
  }
  return point;
}
