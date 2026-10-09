import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
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
// Client service role, comme l'accueil : le rôle anon a un délai très court
// et le recalcul en arrière-plan échouait encore le 08/10 pendant les
// écritures de la synchro (la page gardait alors l'ancien compte). Un seul
// comptage par type toutes les 10 minutes, jamais par visite.
const cachedActiveCount = unstable_cache(
  async (type: ContractType | "all") => {
    // GET limité à une ligne plutôt qu'un HEAD : même compte, et compatible
    // avec tous les intermédiaires.
    let query = createAdminClient().from("offers").select("id", { count: "exact" }).eq("is_active", true).range(0, 0);
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
// Chaque page de liste est en cache 10 minutes et lue par le rôle service :
// les robots parcourent ?page=2..150, et la requête à chaque visite (rôle
// anon, délai court) dépassait le délai sur /offres/stage (09/10).
const cachedOffersPage = unstable_cache(
  async (type: ContractType | "all", page: number) => {
    let query = createAdminClient()
      .from("offers")
      .select(PUBLIC_OFFER_COLUMNS)
      .eq("is_active", true)
      .order("published_at", { ascending: false })
      .order("id")
      .range((page - 1) * PUBLIC_OFFERS_PAGE_SIZE, page * PUBLIC_OFFERS_PAGE_SIZE - 1);
    if (type !== "all") query = query.eq("contract_type", type);
    const { data, error } = await query;
    if (error) {
      if (isPageOutOfRange(error)) return null;
      throw new Error(error.message);
    }
    return (data ?? []) as PublicOfferRow[];
  },
  ["public-offers-page-v1"],
  { revalidate: 600 },
);

export async function fetchPublicOffers(type: ContractType | undefined, page: number) {
  const [rows, count] = await Promise.all([cachedOffersPage(type ?? "all", page), cachedActiveCount(type ?? "all")]);
  if (rows === null) return { offers: [] as PublicOfferRow[], count: 0, totalPages: 0 };
  const data = rows;
  const totalPages = Math.max(1, Math.ceil(count / PUBLIC_OFFERS_PAGE_SIZE));
  // Page au-delà de la dernière (le compte en cache peut avoir 10 minutes de
  // retard) : vide, comme le PGRST103 ci-dessus.
  if (data.length === 0 && page > 1) return { offers: [] as PublicOfferRow[], count, totalPages: 0 };

  return { offers: data, count, totalPages };
}
