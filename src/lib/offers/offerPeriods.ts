import { unstable_cache } from "next/cache";
import { PUBLIC_OFFER_COLUMNS, type PublicOfferRow } from "@/lib/offers/fetchPublicOffers";
import { normalizeTitle } from "@/lib/seo/metiers";
import { createCatalogClient } from "@/lib/supabase/catalog";
import { fetchAllRowsByIdCursor } from "@/lib/supabase/public";
import type { ContractType } from "@/types/database";

// Offres par période, repérées dans l'intitulé, et pour l'alternance aussi
// dans la description (aucune date de début structurée dans les offres) :
// « stage de fin d'études » (PFE, 6 mois, M2, 3A), « stage janvier 2027 »,
// « alternance janvier 2027 » (rentrée décalée). Recherches d'automne des
// étudiants. Lecture en cache 1 h, rôle service, comme l'index des pages.

export type PeriodKey = "stage/fin-d-etudes" | "stage/janvier-2027" | "alternance/janvier-2027";

const EARLY_2027 =
  /janv(ier|\.)?\s*(20)?27\b|fevr?(ier|\.)?\s*(20)?27\b|(a partir de|des|debut|demarrage)\s+(mi-?)?(janvier|fevrier)|debut 2027/;

type OfferPeriod = {
  type: ContractType;
  slug: string;
  name: string;
  pattern: RegExp;
  // Facultatif : repérage dans la description (présélection en base par
  // `descriptionHints`, puis vérification par `descriptionPattern`).
  descriptionHints?: string[];
  descriptionPattern?: RegExp;
};

export const OFFER_PERIODS: Record<PeriodKey, OfferPeriod> = {
  "stage/fin-d-etudes": {
    type: "stage",
    slug: "fin-d-etudes",
    name: "Stage de fin d'études",
    pattern: /\bpfe\b|\btfe\b|fin d'?\s?etudes|fin de cursus|stage de fin|\b6 mois\b|\bsix mois\b|\bm2\b|master 2\b|\b3a\b/,
  },
  "stage/janvier-2027": {
    type: "stage",
    slug: "janvier-2027",
    name: "Stage janvier 2027",
    pattern: new RegExp(`${EARLY_2027.source}|\\bstage 2027\\b|\\b2027\\b.{0,20}\\bstage\\b|\\bstage\\b.{0,20}\\b2027\\b`),
  },
  // Pas de « 2027 » seul : « alternance 2026-2027 » désigne l'année
  // scolaire commencée en septembre, pas une rentrée décalée.
  "alternance/janvier-2027": {
    type: "alternance",
    slug: "janvier-2027",
    name: "Alternance janvier 2027",
    pattern: new RegExp(`${EARLY_2027.source}|rentree (decalee|de janvier|de fevrier|de mars|en janvier|en fevrier|en mars)`),
    // Les intitulés donnent rarement la date ; la description, plus souvent
    // (« début du contrat : janvier 2027 », « rentrée décalée »). Une date
    // seule ne suffit pas (« de septembre 2026 à février 2027 ») : il faut un
    // mot de démarrage juste avant.
    descriptionHints: ["janvier 2027", "février 2027", "fevrier 2027", "rentrée décalée", "rentree decalee"],
    descriptionPattern:
      /\b(debut|demarrage|demarrer|a partir d[eu]|commencant|commence|commencer|prise de poste|rentree|start)\b[^.\n]{0,40}\b(janv(ier|\.)?|fevr?(ier|\.)?)\s*(20)?27\b|\bdes (mi-?)?(janv(ier|\.)?|fevr?(ier|\.)?)\s*(20)?27\b|(?<!(pas de|sans|aucune) )rentree decalee/,
  },
};

const byRecent = (a: PublicOfferRow, b: PublicOfferRow) => b.published_at.localeCompare(a.published_at) || a.id.localeCompare(b.id);

// Plus récentes d'abord, mais une seule offre par entreprise et intitulé en
// tête de liste : un organisme qui publie 25 fois la même annonce (une par
// lieu) ne remplit pas la première page. Les autres suivent, rien n'est retiré.
function diverseFirst(rows: PublicOfferRow[]): PublicOfferRow[] {
  const sorted = [...rows].sort(byRecent);
  const seen = new Set<string>();
  const first: PublicOfferRow[] = [];
  const rest: PublicOfferRow[] = [];
  for (const row of sorted) {
    const key = `${row.company.trim().toLowerCase()}|${normalizeTitle(row.title)}`;
    (seen.has(key) ? rest : first).push(row);
    seen.add(key);
  }
  return [...first, ...rest];
}

function periodsOf(type: ContractType): PeriodKey[] {
  return (Object.keys(OFFER_PERIODS) as PeriodKey[]).filter((key) => OFFER_PERIODS[key].type === type);
}

// Pages par période dont relève une offre (lien depuis sa fiche).
export function periodsOfOffer(offer: { title: string; contract_type: ContractType; description?: string | null }): PeriodKey[] {
  const title = normalizeTitle(offer.title);
  const description = offer.description ? normalizeTitle(offer.description) : "";
  return periodsOf(offer.contract_type).filter(
    (key) => OFFER_PERIODS[key].pattern.test(title) || Boolean(description && OFFER_PERIODS[key].descriptionPattern?.test(description)),
  );
}

// Offres dont la description annonce la période, par identifiant. En cas
// d'échec (délai dépassé…), on garde les seuls intitulés.
async function matchDescriptions(supabase: ReturnType<typeof createCatalogClient>, type: ContractType, keys: PeriodKey[]) {
  const byId = new Map<string, PeriodKey[]>();
  for (const key of keys) {
    const { descriptionHints, descriptionPattern } = OFFER_PERIODS[key];
    if (!descriptionHints || !descriptionPattern) continue;
    try {
      const { data, error } = await supabase
        .from("offers")
        .select("id, description")
        .eq("is_active", true)
        .eq("contract_type", type)
        .or(descriptionHints.map((hint) => `description.ilike.*${hint}*`).join(","))
        .limit(1000);
      if (error) throw new Error(error.message);
      for (const row of (data ?? []) as { id: string; description: string | null }[]) {
        if (row.description && descriptionPattern.test(normalizeTitle(row.description))) byId.set(row.id, [...(byId.get(row.id) ?? []), key]);
      }
    } catch (err) {
      console.error(`offer periods: description search failed for ${key}`, err);
    }
  }
  return byId;
}

// Stages (~3 000 offres) : lignes complètes. Alternance (~15 000) : d'abord
// id + intitulé, puis le détail des seules offres retenues.
const cachedPeriodOffers = unstable_cache(
  async (type: ContractType): Promise<Partial<Record<PeriodKey, PublicOfferRow[]>>> => {
    const supabase = createCatalogClient();
    const keys = periodsOf(type);
    const byDescription = await matchDescriptions(supabase, type, keys);
    const matches = (row: { id: string; title: string }) => [
      ...new Set([...periodsOfOffer({ title: row.title, contract_type: type }), ...(byDescription.get(row.id) ?? [])]),
    ];
    let rows: PublicOfferRow[];
    if (type === "stage") {
      rows = await fetchAllRowsByIdCursor<PublicOfferRow>((afterId, limit) => {
        let query = supabase.from("offers").select(PUBLIC_OFFER_COLUMNS).eq("is_active", true).eq("contract_type", type);
        if (afterId) query = query.gt("id", afterId);
        return query.order("id").limit(limit);
      });
    } else {
      const titles = await fetchAllRowsByIdCursor<{ id: string; title: string }>((afterId, limit) => {
        let query = supabase.from("offers").select("id, title").eq("is_active", true).eq("contract_type", type);
        if (afterId) query = query.gt("id", afterId);
        return query.order("id").limit(limit);
      });
      const ids = titles.filter((row) => matches(row).length > 0).map((row) => row.id);
      rows = [];
      for (let i = 0; i < ids.length; i += 200) {
        const { data, error } = await supabase.from("offers").select(PUBLIC_OFFER_COLUMNS).in("id", ids.slice(i, i + 200));
        if (error) throw new Error(error.message);
        rows.push(...((data ?? []) as PublicOfferRow[]));
      }
    }
    const result: Partial<Record<PeriodKey, PublicOfferRow[]>> = {};
    for (const key of keys) result[key] = diverseFirst(rows.filter((row) => matches(row).includes(key)));
    return result;
  },
  ["offer-period-offers-v3"],
  { revalidate: 3600 },
);

export async function getPeriodOffers(key: PeriodKey): Promise<PublicOfferRow[]> {
  return (await cachedPeriodOffers(OFFER_PERIODS[key].type))[key] ?? [];
}
