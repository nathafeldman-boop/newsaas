import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OfferListCard } from "@/components/offers/OfferListCard";
import { computeMatchScore } from "@/lib/matching/score";
import type { ApplicationStatus } from "@/types/database";

export default async function FavorisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/favoris");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: liked } = await supabase
    .from("swipes")
    .select("offer_id")
    .eq("user_id", user.id)
    .eq("direction", "like")
    .order("created_at", { ascending: false });

  const offerIds = (liked ?? []).map((s) => s.offer_id);

  const [{ data: offers }, { data: applications }] = await Promise.all([
    offerIds.length
      ? supabase.from("offers").select("*").in("id", offerIds)
      : Promise.resolve({ data: [] as never[] }),
    supabase
      .from("applications")
      .select("offer_id, status")
      .eq("user_id", user.id),
  ]);

  const statusByOffer = new Map<string, ApplicationStatus>(
    (applications ?? []).map((a) => [a.offer_id, a.status]),
  );
  const offerById = new Map((offers ?? []).map((o) => [o.id, o]));
  const orderedOffers = offerIds
    .map((id) => offerById.get(id))
    .filter((o): o is NonNullable<typeof o> => Boolean(o));

  return (
    <div>
      <h1 style={{ fontSize: 30, margin: 0 }}>Tes favoris</h1>
      <p style={{ fontSize: 14, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "6px 0 0" }}>
        Les offres que tu as likées, prêtes à recevoir ta candidature.
      </p>

      {orderedOffers.length === 0 ? (
        <p className="mt-10 text-center" style={{ color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
          Aucun favori pour l&apos;instant — va swiper quelques offres !
        </p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {orderedOffers.map((offer) => (
            <OfferListCard
              key={offer.id}
              offer={offer}
              applicationStatus={statusByOffer.get(offer.id) ?? null}
              matchScore={profile ? computeMatchScore(profile, offer) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
