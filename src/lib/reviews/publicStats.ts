import { createAdminClient } from "@/lib/supabase/admin";

// Lecture publique (page d'accueil, hors compte) d'un agrégat sur les avis
// approuvés -- policy RLS de `reviews` ne permet qu'à chacun de lire son
// propre avis (voir supabase/migrations/20260904000000_admin_dashboard_v2.sql),
// donc le client admin est nécessaire ici. On n'expose jamais que des
// agrégats/contenus déjà `status = 'approved'`, jamais de ligne brute ou de
// donnée en attente de modération.

export async function getPublicReviewStats(): Promise<{ count: number; average: number | null }> {
  const admin = createAdminClient();
  const { data } = await admin.from("reviews").select("rating").eq("status", "approved");
  const ratings = data ?? [];
  if (ratings.length === 0) return { count: 0, average: null };

  const average = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  return { count: ratings.length, average: Math.round(average * 10) / 10 };
}

export type PublicTestimonial = { quote: string; author: string };

export async function getPublicTestimonials(limit: number): Promise<PublicTestimonial[]> {
  const admin = createAdminClient();
  const { data: reviews } = await admin
    .from("reviews")
    .select("user_id, rating, comment")
    .eq("status", "approved")
    .not("comment", "is", null)
    .order("rating", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  const withComment = (reviews ?? []).filter(
    (r): r is typeof r & { comment: string } => !!r.comment && r.comment.trim().length > 0,
  );
  if (withComment.length === 0) return [];

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name")
    .in(
      "id",
      withComment.map((r) => r.user_id),
    );
  const nameByUserId = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return withComment.map((r) => ({
    quote: r.comment.trim(),
    // Prénom seul : page publique sans compte, pas besoin du nom complet.
    author: nameByUserId.get(r.user_id)?.split(" ")[0] || "Utilisateur·rice Stageio",
  }));
}
