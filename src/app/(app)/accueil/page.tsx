import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { computeMatchScore } from "@/lib/matching/score";

export default async function AccueilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/accueil");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile && !profile.onboarding_completed) redirect("/onboarding");

  const { data: swiped } = await supabase
    .from("swipes")
    .select("offer_id")
    .eq("user_id", user.id);
  const excludeIds = (swiped ?? []).map((s) => s.offer_id);

  let query = supabase
    .from("offers")
    .select("*")
    .eq("is_active", true)
    .order("published_at", { ascending: false })
    .limit(30);

  if (excludeIds.length > 0) {
    query = query.not("id", "in", `(${excludeIds.join(",")})`);
  }
  if (profile?.looking_for && profile.looking_for.length > 0) {
    query = query.in("contract_type", profile.looking_for);
  }

  const { data: rawOffers } = await query;
  const offers = rawOffers ?? [];

  const scored = profile
    ? offers
        .map((offer) => ({ offer, score: computeMatchScore(profile, offer) }))
        .sort((a, b) => b.score - a.score)
    : offers.map((offer) => ({ offer, score: 0 }));

  const todayStr = new Date().toISOString().slice(0, 10);
  const newTodayCount = offers.filter(
    (o) => o.published_at.slice(0, 10) === todayStr,
  ).length;
  const topMatches = scored.slice(0, 3);
  const excellentCount = scored.filter((m) => m.score >= 85).length;

  return (
    <div className="mx-auto w-full max-w-[1040px]">
      <h1>
        {newTodayCount > 0
          ? `${newTodayCount} nouvelle${newTodayCount > 1 ? "s" : ""} offre${newTodayCount > 1 ? "s" : ""} pour toi aujourd'hui`
          : "Tes offres du moment"}
      </h1>
      <p style={{ fontSize: 14, color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
        {excellentCount > 0
          ? `${excellentCount} excellente${excellentCount > 1 ? "s" : ""} correspondance${excellentCount > 1 ? "s" : ""} repérée${excellentCount > 1 ? "s" : ""} ce matin.`
          : "Swipe pour découvrir ce qui matche ton profil."}
      </p>

      <Link
        href="/swipe"
        className="card elev-md mt-6 flex-row items-center justify-between no-underline"
        style={{ background: "var(--color-accent)", color: "var(--color-bg)", padding: "var(--space-6)" }}
      >
        <div>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 20, margin: 0 }}>
            Continuer à swiper
          </p>
          <p style={{ fontSize: 13, opacity: 0.9, margin: "4px 0 0" }}>
            {offers.length > 0
              ? `${offers.length} offre${offers.length > 1 ? "s" : ""} t'attendent dans le deck du jour.`
              : "De nouvelles offres arrivent régulièrement."}
          </p>
        </div>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: 28 }}>→</span>
      </Link>

      {topMatches.length > 0 && (
        <>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 16, margin: "32px 0 12px" }}>
            Tes meilleurs matchs
          </p>
          <div className="flex flex-col gap-3">
            {topMatches.map(({ offer, score }) => (
              <Link
                key={offer.id}
                href="/swipe"
                className="card flex-row items-center justify-between no-underline"
                style={{ color: "inherit" }}
              >
                <div>
                  <p style={{ fontWeight: 600, margin: 0 }}>{offer.title}</p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "color-mix(in srgb, var(--color-text) 60%, transparent)",
                      margin: "2px 0 0",
                    }}
                  >
                    {offer.company} · {offer.location}
                  </p>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: 17,
                    color: "var(--color-accent-2-700)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {score}%
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
