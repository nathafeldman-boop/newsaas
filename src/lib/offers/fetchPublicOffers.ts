import { createClient } from "@/lib/supabase/server";
import type { ContractType } from "@/types/database";

export const PUBLIC_OFFERS_PAGE_SIZE = 24;

export type PublicOfferRow = {
  id: string;
  title: string;
  company: string;
  location: string;
  contract_type: ContractType;
  sector: string | null;
  published_at: string;
};

// Partagé entre /offres (toutes), /offres/alternance et /offres/stage --
// mêmes données, filtre `type` optionnel en plus.
export async function fetchPublicOffers(type: ContractType | undefined, page: number) {
  const supabase = await createClient();
  let query = supabase
    .from("offers")
    .select("id, title, company, location, contract_type, sector, published_at", {
      count: "exact",
    })
    .eq("is_active", true)
    .order("published_at", { ascending: false })
    .range((page - 1) * PUBLIC_OFFERS_PAGE_SIZE, page * PUBLIC_OFFERS_PAGE_SIZE - 1);

  if (type) query = query.eq("contract_type", type);

  const { data, count } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PUBLIC_OFFERS_PAGE_SIZE));

  return { offers: (data ?? []) as PublicOfferRow[], count: count ?? 0, totalPages };
}
