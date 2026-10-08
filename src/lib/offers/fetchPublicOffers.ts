import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { ContractType } from "@/types/database";

export const PUBLIC_OFFERS_PAGE_SIZE = 24;

export const PUBLIC_OFFER_COLUMNS = "id, title, company, location, contract_type, sector, published_at";

export type PublicOfferRow = {
  id: string;
  title: string;
  company: string;
  location: string;
  contract_type: ContractType;
  sector: string | null;
  published_at: string;
};

// PGRST103 = PostgREST refuse un .range() qui commence après la dernière
// ligne (?page=999) : ce n'est pas une panne, la page n'existe simplement
// pas -- totalPages 0 fait répondre 404 à l'appelant.
export function isPageOutOfRange(error: { code?: string }): boolean {
  return error.code === "PGRST103";
}

// Nombre d'offres actives (par type), mis en cache 10 minutes : le compte
// exact parcourait toutes les offres actives à chaque page vue (robots
// compris, sur ?page=2..N) et a déjà dépassé le délai de la base
// (statement timeout, /offres/stage le 07/10), alors que le catalogue
// grossit avec la synchro France Travail par département.
const cachedActiveCount = unstable_cache(
  async (type: ContractType | "all") => {
    // GET limité à une ligne plutôt qu'un HEAD : même compte, et compatible
    // avec tous les intermédiaires.
    let query = createPublicClient().from("offers").select("id", { count: "exact" }).eq("is_active", true).range(0, 0);
    if (type !== "all") query = query.eq("contract_type", type);
    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return count ?? 0;
  },
  ["public-offers-count-v2"],
  { revalidate: 600 },
);

export function fetchActiveOfferCount(type: ContractType | "all"): Promise<number> {
  return cachedActiveCount(type);
}

// Partagé entre /offres (toutes), /offres/alternance et /offres/stage --
// mêmes données, filtre `type` optionnel en plus. Une erreur Supabase
// remonte (500, que Google réessaie) au lieu d'afficher une liste vide en
// 200, qui ressemblerait à une page sans contenu (soft 404).
export async function fetchPublicOffers(type: ContractType | undefined, page: number) {
  const supabase = createPublicClient();
  let query = supabase
    .from("offers")
    .select(PUBLIC_OFFER_COLUMNS)
    .eq("is_active", true)
    .order("published_at", { ascending: false })
    .order("id")
    .range((page - 1) * PUBLIC_OFFERS_PAGE_SIZE, page * PUBLIC_OFFERS_PAGE_SIZE - 1);

  if (type) query = query.eq("contract_type", type);

  const [{ data, error }, count] = await Promise.all([query, cachedActiveCount(type ?? "all")]);
  if (error) {
    if (isPageOutOfRange(error)) return { offers: [] as PublicOfferRow[], count: 0, totalPages: 0 };
    throw new Error(error.message);
  }
  const totalPages = Math.max(1, Math.ceil(count / PUBLIC_OFFERS_PAGE_SIZE));
  // Page au-delà de la dernière (le compte en cache peut avoir 10 minutes de
  // retard) : vide, comme le PGRST103 ci-dessus.
  if ((data ?? []).length === 0 && page > 1) return { offers: [] as PublicOfferRow[], count, totalPages: 0 };

  return { offers: (data ?? []) as PublicOfferRow[], count, totalPages };
}
