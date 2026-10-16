import { createAdminClient } from "@/lib/supabase/admin";

// Lecture publique (page d'accueil, hors compte) d'un agrégat sur les avis
// approuvés -- policy RLS de `reviews` ne permet qu'à chacun de lire son
// propre avis (voir supabase/migrations/20260904000000_admin_dashboard_v2.sql),
// donc le client admin est nécessaire ici. On n'expose jamais que des
// agrégats/contenus déjà `status = 'approved'`, jamais de ligne brute ou de
// donnée en attente de modération.

export async function getPublicReviewStats(): Promise<{ count: number; average: number | null }> {
  const admin = createAdminClient();
  // Borné par prudence (voir /admin même souci sur cette table) : jamais de
  // truncation silencieuse du Max Rows Supabase si "reviews" grossit un jour.
  const { data, error } = await admin.from("reviews").select("rating").eq("status", "approved").limit(5000);
  if (error) console.error("getPublicReviewStats: reviews query failed", error);
  const ratings = data ?? [];
  if (ratings.length === 0) return { count: 0, average: null };

  const average = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  return { count: ratings.length, average: Math.round(average * 10) / 10 };
}

export type PublicTestimonial = { quote: string; author: string; rating: number };

export async function getPublicTestimonials(limit: number): Promise<PublicTestimonial[]> {
  const admin = createAdminClient();
  const { data: reviews } = await admin
    .from("reviews")
    .select("user_id, rating, comment")
    .eq("status", "approved")
    .gte("rating", 4)
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
    rating: r.rating,
    // Prénom seul : page publique sans compte, pas besoin du nom complet.
    author: nameByUserId.get(r.user_id)?.split(" ")[0] || "Utilisateur·rice Stageio",
  }));
}

// Note moyenne des avis approuvés laissés par des étudiants qui ont payé
// (paywall, 16/10 : Nathan veut la note de ceux qui paient, sans le nombre
// d'avis). Toujours la vraie moyenne -- null s'il y a moins de 3 avis
// payants, trop peu pour afficher une note.
export async function getPaidReviewAverage(): Promise<number | null> {
  const admin = createAdminClient();
  const { data: reviews, error } = await admin.from("reviews").select("user_id, rating").eq("status", "approved").limit(5000);
  if (error) console.error("getPaidReviewAverage: reviews query failed", error);
  if (!reviews?.length) return null;

  const { data: payers } = await admin
    .from("profiles")
    .select("id")
    .gt("total_paid_cents", 0)
    .in("id", [...new Set(reviews.map((r) => r.user_id))]);
  const paid = new Set((payers ?? []).map((p) => p.id));
  const ratings = reviews.filter((r) => paid.has(r.user_id)).map((r) => r.rating);
  if (ratings.length < 3) return null;
  return Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10;
}
