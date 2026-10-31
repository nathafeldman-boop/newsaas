import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  DEPARTEMENTS,
  REGIONS,
  departementFromLocation,
  getDepartement,
  isOverseasDepartement,
  learnCityDepartements,
  regionOfDepartement,
} from "@/lib/seo/departements";
import { normalizeCityKey, slugify } from "@/lib/offers/segments";
import { profileDepartement } from "@/lib/matching/score";

// Où habite l'abonné (31/10, avis « trop loin ») : la ville tapée à
// l'onboarding n'est pas toujours une ville de la table (« Melun »,
// « Bourg-en-Bresse », « Toul 54200 », « 92 », « Ain 01 »,
// « Île-de-France ») -- 288 profils sur 4 161 le 31/10. Sans département,
// une offre du département voisin comptait comme une offre à l'autre bout
// de la France (−30), et le paquet de proximité restait vide. Fonctions
// pures, sauf la recherche de commune (lookupCommuneDepartement).

export type ProfileLocation = {
  departement: string | null;
  /** Une région entière a été saisie (« Île-de-France ») : toute la région compte comme proche. */
  regionWide: boolean;
};

const valid = (code: string | null | undefined) => (code && getDepartement(code) ? code : null);

function fromPostalCode(text: string): string | null {
  const m = text.match(/\b(\d{5})\b/);
  if (!m) return null;
  const cp = m[1];
  if (cp.startsWith("97") || cp.startsWith("98")) return valid(cp.slice(0, 3));
  if (cp.startsWith("20")) return Number(cp) < 20200 ? "2A" : "2B";
  return valid(cp.slice(0, 2));
}

const REGION_ALIASES: [RegExp, string][] = [[/\biles?[- ]de[- ]fra/, "Île-de-France"]];

function regionOf(text: string): string | null {
  const slug = slugify(text);
  const region = REGIONS.find((r) => slug.includes(r.slug));
  if (region) return region.name;
  const lower = text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return REGION_ALIASES.find(([re]) => re.test(lower))?.[1] ?? null;
}

/** Département de la ville saisie, sans lecture en base. */
export function parseProfileLocation(city: string | null | undefined): ProfileLocation {
  const text = city?.trim() ?? "";
  if (!text) return { departement: null, regionWide: false };
  const known = profileDepartement(text);
  if (known) return { departement: known, regionWide: false };
  const inParens = valid(text.match(/\((\d{2,3}|2[AB])\)/i)?.[1]?.toUpperCase());
  if (inParens) return { departement: inParens, regionWide: false };
  const postal = fromPostalCode(text);
  if (postal) return { departement: postal, regionWide: false };
  const bare = valid(text.match(/^(\d{2,3}|2[AB])$/i)?.[1]?.toUpperCase());
  if (bare) return { departement: bare, regionWide: false };
  // « Ain 01 », « Evreux 27000 » déjà vu plus haut : le nom sans les chiffres.
  const withoutDigits = text.replace(/\d+/g, " ").replace(/\s+/g, " ").trim();
  const byName = withoutDigits && withoutDigits !== text ? profileDepartement(withoutDigits) : null;
  if (byName) return { departement: byName, regionWide: false };
  const region = regionOf(text);
  if (region) {
    // Un département de la région sert d'ancre (Paris pour l'Île-de-France).
    const anchor = DEPARTEMENTS.find((d) => regionOfDepartement(d.code)?.name === region);
    if (anchor) return { departement: anchor.code, regionWide: true };
  }
  return { departement: null, regionWide: false };
}

/**
 * Offre d'outre-mer pour un abonné de métropole : jamais proche, même
 * « mobile en France » (31/10 : des offres de la Réunion et de Guyane
 * dans des paquets de Lyon et de Paris). Département inconnu : on ne
 * sait pas, l'offre reste.
 */
export function overseasMismatch(profileDep: string | null, offerLocation: string): boolean {
  if (!profileDep || isOverseasDepartement(profileDep)) return false;
  return isOverseasDepartement(departementFromLocation(offerLocation));
}

const communeCache = new Map<string, string | null>();

/**
 * Commune absente de la table des villes : son département d'après les
 * libellés France Travail des offres (« 77 - MELUN »), toutes offres
 * confondues. Une commune vue dans deux départements reste inconnue.
 */
export async function lookupCommuneDepartement(db: SupabaseClient<Database>, city: string): Promise<string | null> {
  const key = slugify(normalizeCityKey(city));
  if (key.length < 3 || /\d/.test(city)) return null;
  if (communeCache.has(key)) return communeCache.get(key) ?? null;
  // Tout ce qui n'est pas une lettre sans accent devient « _ » (un caractère
  // quelconque) : « Champs sur Marne » trouve « CHAMPS-SUR-MARNE »,
  // « Montluçon » trouve « MONTLUCON ».
  const pattern = city.trim().replace(/[^A-Za-z]/g, "_");
  const { data, error } = await db.from("offers").select("location").ilike("location", `%- ${pattern}`).limit(20);
  if (error) return null;
  const departement = learnCityDepartements((data ?? []).map((row) => row.location)).get(key) ?? null;
  if (communeCache.size > 2000) communeCache.clear();
  communeCache.set(key, departement);
  return departement;
}
