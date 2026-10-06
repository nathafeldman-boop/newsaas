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

// Partagé entre /offres (toutes), /offres/alternance et /offres/stage --
// mêmes données, filtre `type` optionnel en plus. Une erreur Supabase
// remonte (500, que Google réessaie) au lieu d'afficher une liste vide en
// 200, qui ressemblerait à une page sans contenu (soft 404).
export async function fetchPublicOffers(type: ContractType | undefined, page: number) {
  const supabase = createPublicClient();
  let query = supabase
    .from("offers")
    .select(PUBLIC_OFFER_COLUMNS, { count: "exact" })
    .eq("is_active", true)
    .order("published_at", { ascending: false })
    .order("id")
    .range((page - 1) * PUBLIC_OFFERS_PAGE_SIZE, page * PUBLIC_OFFERS_PAGE_SIZE - 1);

  if (type) query = query.eq("contract_type", type);

  const { data, count, error } = await query;
  if (error) {
    if (isPageOutOfRange(error)) return { offers: [] as PublicOfferRow[], count: 0, totalPages: 0 };
    throw new Error(error.message);
  }
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PUBLIC_OFFERS_PAGE_SIZE));

  return { offers: (data ?? []) as PublicOfferRow[], count: count ?? 0, totalPages };
}
