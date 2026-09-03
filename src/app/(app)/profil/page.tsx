import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { GmailConnectionPanel } from "@/components/profile/GmailConnectionPanel";
import { SettingsPanel } from "@/components/profile/SettingsPanel";
import { isPremium } from "@/lib/subscription/isPremium";
import type { ApplicationStatus } from "@/types/database";

export default async function ProfilPage({
  searchParams,
}: {
  searchParams: Promise<{ gmail?: string }>;
}) {
  const { gmail } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profil");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = Boolean(user.email && adminEmails.includes(user.email.toLowerCase()));

  const initial = (profile.full_name || user.email || "?").charAt(0).toUpperCase();
  const premium = isPremium(profile);

  const [{ data: gmailConnection }, { data: applications }] = await Promise.all([
    supabase
      .from("email_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "gmail")
      .maybeSingle(),
    supabase.from("applications").select("status").eq("user_id", user.id),
  ]);

  const statCounts: Record<"total" | ApplicationStatus, number> = {
    total: applications?.length ?? 0,
    envoyee: 0,
    en_cours: 0,
    entretien: 0,
    acceptee: 0,
    refusee: 0,
  };
  for (const app of applications ?? []) {
    statCounts[app.status]++;
  }

  return (
    <div className="mx-auto w-full max-w-[520px]">
      <div className="flex items-center gap-4">
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--color-accent-100)",
            color: "var(--color-accent-700)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-heading)",
            fontSize: 26,
            flexShrink: 0,
          }}
        >
          {initial}
        </div>
        <div>
          <h1 style={{ fontSize: 28, margin: 0 }}>Profil & stats</h1>
          <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "2px 0 0" }}>
            Ces infos servent à te proposer de meilleures offres.
          </p>
        </div>
      </div>

      {statCounts.total > 0 && (
        <Link
          href="/mes-candidatures"
          className="card elev-sm mt-6 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4 sm:gap-5 no-underline"
          style={{ color: "inherit", padding: "var(--space-4) var(--space-6)" }}
        >
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 26, color: "var(--color-accent)", margin: 0 }}>
              {statCounts.envoyee + statCounts.en_cours}
            </p>
            <p style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "4px 0 0" }}>
              Envoyées
            </p>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 26, margin: 0 }}>{statCounts.entretien}</p>
            <p style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "4px 0 0" }}>
              Entretiens
            </p>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 26, color: "var(--color-accent-2-700)", margin: 0 }}>{statCounts.acceptee}</p>
            <p style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "4px 0 0" }}>
              Ton alternance ✓
            </p>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: 26, margin: 0 }}>{statCounts.refusee}</p>
            <p style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "4px 0 0" }}>
              Refusées
            </p>
          </div>
        </Link>
      )}

      <div className="mt-6">
        <ProfileForm userId={user.id} initialProfile={profile} />
      </div>

      <GmailConnectionPanel connection={gmailConnection ?? null} statusParam={gmail} />

      <SettingsPanel userId={user.id} initialNotifyNewOffers={profile.notify_new_offers} />

      <div className="flex flex-col gap-2.5 mt-5">
        <Link
          href="/premium"
          className="card flex-row items-center justify-between no-underline"
          style={{ color: "inherit", padding: "var(--space-3) var(--space-4)" }}
        >
          <span style={{ fontSize: 14 }}>{premium ? "🔓 Abonnement Premium actif" : "Passer Premium (7,99€/mois)"}</span>
          <span>→</span>
        </Link>
        <Link
          href="/mes-candidatures"
          className="card flex-row items-center justify-between no-underline"
          style={{ color: "inherit", padding: "var(--space-3) var(--space-4)" }}
        >
          <span style={{ fontSize: 14 }}>Mes candidatures</span>
          <span>→</span>
        </Link>
        <Link
          href="/parrainage"
          className="card flex-row items-center justify-between no-underline"
          style={{ color: "inherit", padding: "var(--space-3) var(--space-4)" }}
        >
          <span style={{ fontSize: 14 }}>Parrainage</span>
          <span>→</span>
        </Link>
        {isAdmin && (
          <Link
            href="/admin/offres"
            className="card flex-row items-center justify-between no-underline sm:hidden"
            style={{ color: "inherit", padding: "var(--space-3) var(--space-4)" }}
          >
            <span style={{ fontSize: 14 }}>Admin — ingestion d&apos;offres</span>
            <span>→</span>
          </Link>
        )}
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="card flex-row items-center justify-between no-underline"
            style={{
              color: "inherit",
              padding: "var(--space-3) var(--space-4)",
              width: "100%",
              border: "none",
              cursor: "pointer",
              font: "inherit",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: 14 }}>Déconnexion</span>
            <span>→</span>
          </button>
        </form>
      </div>
    </div>
  );
}
