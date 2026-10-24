import { createAdminClient } from "@/lib/supabase/admin";
import type { Offer } from "@/types/database";

// Offres likées ou candidatées par l'étudiant, y compris celles qui ne
// sont plus en ligne (24/10). La règle RLS « offers_select_active » ne
// laisse lire que les offres actives : dès qu'une offre expirait ou était
// retirée par la synchro, elle disparaissait en silence des favoris et du
// suivi des candidatures. Lecture en service_role, mais uniquement pour les
// identifiants déjà lus avec le client de l'étudiant (ses propres swipes et
// candidatures, sous RLS) : il ne voit rien qu'il n'avait déjà enregistré.
// Les offres elles-mêmes sont des annonces publiques, sans donnée personnelle.

const CHUNK = 150;

export async function ownOffersByIds(ids: string[]): Promise<Offer[]> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return [];
  const db = createAdminClient();
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += CHUNK) chunks.push(unique.slice(i, i + CHUNK));
  const results = await Promise.all(chunks.map((chunk) => db.from("offers").select("*").in("id", chunk)));
  const out: Offer[] = [];
  for (const { data, error } of results) {
    if (error) throw new Error(`ownOffersByIds: ${error.message}`);
    out.push(...(data ?? []));
  }
  return out;
}
