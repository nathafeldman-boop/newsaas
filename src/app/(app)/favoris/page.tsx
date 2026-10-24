import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FavoritesBoard, type FavoriteItem } from "@/components/offers/FavoritesBoard";
import { ownOffersByIds } from "@/lib/applications/ownOffers";
import { computeMatchScore } from "@/lib/matching/score";
import type { ApplicationStatus } from "@/types/database";

export default async function FavorisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/favoris");

  const [{ data: profile }, { data: liked }, { data: applications }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("swipes").select("offer_id, created_at").eq("user_id", user.id).eq("direction", "like").order("created_at", { ascending: false }),
    supabase.from("applications").select("offer_id, status").eq("user_id", user.id),
  ]);

  // Offres plus en ligne comprises (voir ownOffers.ts) : avant le 24/10,
  // elles disparaissaient de la liste sans explication.
  const offers = await ownOffersByIds((liked ?? []).map((s) => s.offer_id)).catch((err) => {
    console.error("favoris: offres illisibles", err);
    return [];
  });
  const offerById = new Map(offers.map((o) => [o.id, o]));
  const statusByOffer = new Map<string, ApplicationStatus>((applications ?? []).map((a) => [a.offer_id, a.status]));

  const items: FavoriteItem[] = [];
  for (const s of liked ?? []) {
    const offer = offerById.get(s.offer_id);
    if (!offer) continue;
    items.push({
      // Description et prérequis inutiles à la carte : non envoyés au navigateur.
      offer: { ...offer, description: "", requirements: null },
      likedAt: s.created_at,
      status: statusByOffer.get(offer.id) ?? null,
      matchScore: profile && offer.is_active ? computeMatchScore(profile, offer) : null,
    });
  }

  return (
    <div>
      <h1 style={{ fontSize: 30, margin: 0 }}>Tes favoris</h1>
      <p style={{ fontSize: 14, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "6px 0 0" }}>
        Les offres que tu as likées, prêtes à recevoir ta candidature.
      </p>

      {items.length === 0 ? (
        <p className="mt-10 text-center" style={{ color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
          Aucun favori pour l&apos;instant — va swiper quelques offres !
        </p>
      ) : (
        <FavoritesBoard items={items} />
      )}
    </div>
  );
}
