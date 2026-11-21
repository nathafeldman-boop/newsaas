import type { SupabaseClient } from "@supabase/supabase-js";
import { deckContractTypes } from "@/lib/offers/fetchActiveOffers";
import { targetJobTitlePatterns } from "@/lib/matching/deck";
import { parseProfileLocation } from "@/lib/matching/profileLocation";
import { contractNouns } from "@/lib/offers/contractLabels";
import { CONTRACT_LABEL } from "@/lib/offers/contractLabels";
import { isSchoolAd } from "@/lib/seo/schools";
import type { ContractType, Database, Offer } from "@/types/database";

// Aperçu avant le paywall (21/11, SOP « paywall » appliqué par Nathan) :
// après un like, on montre que sa sélection est prête. Vraies offres du
// compte (types de contrat, département, métier visé), titres lisibles,
// le reste flouté. Jamais de chiffre inventé : le nombre est celui des
// offres en ligne trouvées, plafonné à PREVIEW_CAP (« 200+ » au-delà).
export const PREVIEW_CAP = 200;

export type PaywallPreviewOffer = { id: string; title: string; company: string; place: string; contract: string };
export type PaywallPreviewData = {
  count: number;
  capped: boolean;
  /** « près de Lyon », « dans le 974 », ou null (toute la France). */
  where: string | null;
  /** « On a remarqué : tu cherches ton CDI, en vendeur, à Lyon. » */
  noticed: string;
  offers: PaywallPreviewOffer[];
};

type Profile = { looking_for?: ContractType[] | null; target_jobs?: string[] | null; city?: string | null };

// « 69 - LYON 03 » -> « Lyon 03 ».
function placeOf(location: string): string {
  const town = location.replace(/^\s*(\d{2,3}|2[AB])\s*-\s*/i, "").trim();
  return town.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_, sep: string, c: string) => sep + c.toUpperCase());
}

// « Lyon (69) » -> « Lyon » ; vide si la saisie n'a que des chiffres.
function cityName(city: string | null | undefined): string | null {
  const name = (city ?? "").replace(/\(.*?\)/g, " ").replace(/\d+/g, " ").replace(/\s+/g, " ").trim();
  return name.length >= 2 ? name : null;
}

export async function loadPaywallPreview(supabase: SupabaseClient<Database>, profile: Profile): Promise<PaywallPreviewData | null> {
  const contractTypes = deckContractTypes(profile.looking_for);
  const departement = parseProfileLocation(profile.city).departement;
  const jobs = (profile.target_jobs ?? []).filter((j) => j.trim().length > 0);
  const patterns = targetJobTitlePatterns(jobs);

  type Row = Pick<Offer, "id" | "title" | "company" | "location" | "contract_type">;
  async function search(withTitles: boolean): Promise<Row[]> {
    let q = supabase
      .from("offers")
      .select("id, title, company, location, contract_type")
      .eq("is_active", true)
      .in("contract_type", contractTypes)
      .order("published_at", { ascending: false })
      .limit(PREVIEW_CAP + 1);
    if (departement) q = q.ilike("location", `${departement} -%`);
    if (withTitles && patterns.length > 0) q = q.or(patterns.map((p) => `title.ilike.%${p}%`).join(","));
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    // Entreprise seule (sans la description, trop lourde pour 200 lignes).
    return ((data ?? []) as Row[]).filter((o) => !isSchoolAd({ company: o.company }));
  }

  let rows = await search(true);
  let byJob = patterns.length > 0;
  // Métier trop rare près de chez lui : toutes les offres de son contrat.
  if (byJob && rows.length < 4) {
    rows = await search(false);
    byJob = false;
  }
  if (rows.length === 0) return null;

  const capped = rows.length > PREVIEW_CAP;
  const count = Math.min(rows.length, PREVIEW_CAP);
  const city = cityName(profile.city);
  const where = city ? `près de ${city}` : departement ? `dans le ${departement}` : null;
  const parts = [contractNouns(contractTypes, "ton")];
  if (byJob && jobs[0]) parts.push(`en ${jobs[0].trim().toLowerCase()}`);
  if (city) parts.push(`à ${city}`);

  return {
    count,
    capped,
    where,
    noticed: `On a remarqué : tu cherches ${parts.join(", ")}.`,
    offers: rows.slice(0, 4).map((o) => ({
      id: o.id,
      title: o.title,
      company: o.company,
      place: placeOf(o.location),
      contract: CONTRACT_LABEL[o.contract_type],
    })),
  };
}
