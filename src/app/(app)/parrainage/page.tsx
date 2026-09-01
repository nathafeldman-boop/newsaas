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

  const grantedCount = (referrals ?? []).filter(
    (r) => r.reward_status === "granted",
  ).length;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold">Parraine tes potes</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Partage ton lien : chaque inscription via ton code compte comme un
        filleul.
      </p>

      <div className="mt-6">
        <ReferralLinkCard
          referralLink={referralLink}
          code={profile?.referral_code ?? ""}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-surface p-4 text-center">
          <p className="text-2xl font-bold text-brand-dark">
            {referrals?.length ?? 0}
          </p>
          <p className="text-xs text-foreground/60">Filleuls inscrits</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 text-center">
          <p className="text-2xl font-bold text-brand-dark">{grantedCount}</p>
          <p className="text-xs text-foreground/60">Récompenses validées</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold">Tes filleuls</h2>
        {!referrals || referrals.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/60">
            Personne pour l&apos;instant — envoie ton lien !
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {referrals.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm"
              >
                <span>{nameById.get(r.referred_id) || "Nouveau membre"}</span>
                <span
                  className={
                    r.reward_status === "granted"
                      ? "text-green-600 font-medium"
                      : "text-foreground/50"
                  }
                >
                  {r.reward_status === "granted" ? "Récompensé" : "En attente"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
