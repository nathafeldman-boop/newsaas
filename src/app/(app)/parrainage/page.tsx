import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ReferralLinkCard } from "@/components/referral/ReferralLinkCard";

export default async function ParrainagePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/parrainage");

  const { data: profile } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("id", user.id)
    .single();

  const { data: referrals } = await supabase
    .from("referrals")
    .select("*")
    .eq("referrer_id", user.id)
    .order("created_at", { ascending: false });

  const referredIds = (referrals ?? []).map((r) => r.referred_id);
  const { data: referredProfiles } = referredIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, created_at")
        .in("id", referredIds)
    : { data: [] as never[] };

  const nameById = new Map(
    (referredProfiles ?? []).map((p) => [p.id, p.full_name]),
  );

  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? `${protocol}://${host}`;
  const referralLink = `${origin}/inscription?ref=${profile?.referral_code ?? ""}`;

  const referralCount = referrals?.length ?? 0;
  const grantedCount = (referrals ?? []).filter(
    (r) => r.reward_status === "granted",
  ).length;
  const nextMilestone = Math.max(5, (Math.floor(referralCount / 5) + 1) * 5);

  return (
    <div className="mx-auto w-full max-w-[520px]">
      <h1 style={{ fontSize: 30, margin: 0 }}>Parraine tes potes</h1>
      <p style={{ fontSize: 14, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "6px 0 0" }}>
        Partage ton lien : chaque inscription via ton code compte comme un
        filleul.
      </p>

      <div className="mt-6">
        <ReferralLinkCard referralLink={referralLink} code={profile?.referral_code ?? ""} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="card" style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 26, color: "var(--color-accent)", margin: 0 }}>
            {referralCount}
          </p>
          <p style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "4px 0 0" }}>
            Filleuls inscrits
          </p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 26, color: "var(--color-accent-2)", margin: 0 }}>
            {grantedCount}
          </p>
          <p style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "4px 0 0" }}>
            Récompenses
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {referralCount >= 1 && <span className="tag tag-accent">🥉 Premier filleul</span>}
        <span className="tag tag-neutral">Prochain palier : {nextMilestone} filleuls</span>
      </div>

      <div className="mt-8">
        <h2 style={{ fontSize: 17, margin: 0 }}>Tes filleuls</h2>
        {!referrals || referrals.length === 0 ? (
          <p className="mt-3" style={{ fontSize: 14, color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
            Personne pour l&apos;instant — envoie ton lien !
          </p>
        ) : (
          <div className="mt-3.5 flex flex-col gap-2.5">
            {referrals.map((r) => (
              <div
                key={r.id}
                className="card flex-row items-center justify-between"
                style={{ padding: "var(--space-3) var(--space-4)" }}
              >
                <span style={{ fontSize: 14 }}>{nameById.get(r.referred_id) || "Nouveau membre"}</span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: r.reward_status === "granted" ? 600 : 400,
                    color:
                      r.reward_status === "granted"
                        ? "var(--color-accent-700)"
                        : "color-mix(in srgb, var(--color-text) 50%, transparent)",
                  }}
                >
                  {r.reward_status === "granted" ? "Récompensé" : "En attente"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
