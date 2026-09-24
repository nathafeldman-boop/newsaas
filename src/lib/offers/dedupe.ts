import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Nettoyage périodique des doublons cross-source, appelé depuis le cron
// deactivate-expired-offers (voir RETENTION_AUDIT.md, "déduplication") --
// PAS une contrainte unique à l'insertion : une offre légitimement republiée
// des mois plus tard, une fois l'ancienne expirée, ne doit jamais être
// bloquée. À la place, un passage périodique regroupe les offres ACTIVES
// partageant la même empreinte de contenu (content_fingerprint, voir
// fingerprint.ts) et désactive toutes sauf la plus fraîche -- jamais de
// suppression, cohérent avec le reste du produit (une offre désactivée reste
// en base, juste exclue du feed).
//
// Le survivant hérite de la fraîcheur du doublon désactivé (last_seen_at
// relevé au max des deux) : si l'un des deux exemplaires vient d'être revu
// par un sync, ça compte comme un signal que l'offre est bien toujours en
// ligne, même si c'est l'AUTRE exemplaire qui a été retenu comme survivant.
export async function dedupeActiveOffers(
  admin: SupabaseClient<Database>,
): Promise<{ groupsFound: number; deactivated: number; errors: string[] }> {
  const errors: string[] = [];

  const { data: rows, error } = await admin
    .from("offers")
    .select("id, content_fingerprint, quality_score, published_at, last_seen_at")
    .eq("is_active", true)
    .not("content_fingerprint", "is", null);

  if (error) {
    return { groupsFound: 0, deactivated: 0, errors: [`select: ${error.message}`] };
  }

  const groups = new Map<string, typeof rows>();
  for (const row of rows ?? []) {
    const key = row.content_fingerprint as string;
    const arr = groups.get(key);
    if (arr) arr.push(row);
    else groups.set(key, [row]);
  }

  let groupsFound = 0;
  let deactivated = 0;

  for (const [, group] of groups) {
    if (group.length < 2) continue;
    groupsFound++;

    // Survivant : meilleure qualité d'abord (une fiche plus complète vaut
    // mieux qu'une fiche plus récente mais vide), puis la plus récemment
    // publiée en départage.
    const sorted = [...group].sort((a, b) => {
      if (b.quality_score !== a.quality_score) return b.quality_score - a.quality_score;
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });
    const [survivor, ...duplicates] = sorted;

    const latestSeenAt = group.reduce(
      (max, r) => (new Date(r.last_seen_at) > new Date(max) ? r.last_seen_at : max),
      survivor.last_seen_at,
    );

    const duplicateIds = duplicates.map((d) => d.id);

    const [{ error: deactivateError }, { error: touchError }] = await Promise.all([
      admin.from("offers").update({ is_active: false }).in("id", duplicateIds),
      admin.from("offers").update({ last_seen_at: latestSeenAt }).eq("id", survivor.id),
    ]);

    if (deactivateError) errors.push(`deactivate group: ${deactivateError.message}`);
    else deactivated += duplicateIds.length;
    if (touchError) errors.push(`touch survivor ${survivor.id}: ${touchError.message}`);
  }

  return { groupsFound, deactivated, errors };
}
