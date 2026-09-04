import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPremium } from "@/lib/subscription/isPremium";
import { grantPremiumAndNotifyAction } from "@/app/admin/users/actions";

const SUBSCRIPTION_LABEL: Record<string, string> = {
  active: "Payant (actif)",
  trialing: "Payant (essai)",
  comp: "Offert (code d'accès)",
  past_due: "Impayé",
  canceled: "Annulé",
};

function fmt(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  });
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: profile }, { data: swipes }, { data: applications }, { data: loginEvents }] =
    await Promise.all([
      admin.from("profiles").select("*").eq("id", id).maybeSingle(),
      admin.from("swipes").select("created_at").eq("user_id", id).order("created_at", { ascending: true }),
      admin
        .from("applications")
        .select("status, applied_at")
        .eq("user_id", id)
        .order("applied_at", { ascending: true }),
      admin
        .from("user_events")
        .select("created_at")
        .eq("user_id", id)
        .eq("event_type", "login"),
    ]);

  if (!profile) notFound();

  const funnel = [
    { label: "Inscription", at: profile.created_at },
    { label: "Onboarding terminé", at: profile.onboarding_completed_at },
    { label: "Premier swipe", at: swipes?.[0]?.created_at ?? null },
    { label: "Première candidature", at: applications?.[0]?.applied_at ?? null },
    { label: "Passage Premium", at: profile.premium_activated_at },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 24, margin: "0 0 4px" }}>{profile.full_name || profile.email}</h1>
      <p style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: 0 }}>
        {profile.email}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card elev-sm" style={{ padding: "var(--space-4)" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 22, margin: 0 }}>
            {((profile.total_paid_cents ?? 0) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
          </p>
          <p style={{ fontSize: 11, textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 65%, transparent)", margin: "4px 0 0" }}>
            LTV
          </p>
        </div>
        <div className="card elev-sm" style={{ padding: "var(--space-4)" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 22, margin: 0 }}>{loginEvents?.length ?? 0}</p>
          <p style={{ fontSize: 11, textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 65%, transparent)", margin: "4px 0 0" }}>
            Sessions
          </p>
        </div>
        <div className="card elev-sm" style={{ padding: "var(--space-4)" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 22, margin: 0 }}>{swipes?.length ?? 0}</p>
          <p style={{ fontSize: 11, textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 65%, transparent)", margin: "4px 0 0" }}>
            Swipes
          </p>
        </div>
        <div className="card elev-sm" style={{ padding: "var(--space-4)" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 22, margin: 0 }}>{applications?.length ?? 0}</p>
          <p style={{ fontSize: 11, textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 65%, transparent)", margin: "4px 0 0" }}>
            Candidatures
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className={isPremium(profile) ? "tag tag-accent" : "tag tag-neutral"}>
          {SUBSCRIPTION_LABEL[profile.subscription_status ?? ""] ?? "Gratuit"}
        </span>
        {!isPremium(profile) && (
          <form action={grantPremiumAndNotifyAction}>
            <input type="hidden" name="userId" value={profile.id} />
            <button type="submit" className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
              A payé mais pas activé → Marquer Premium + prévenir
            </button>
          </form>
        )}
      </div>

      <h2 style={{ fontSize: 16, margin: "28px 0 10px" }}>Funnel</h2>
      <div className="card elev-sm" style={{ padding: "var(--space-4) var(--space-5)" }}>
        {funnel.map((step, i) => (
          <div
            key={step.label}
            className="flex items-center justify-between"
            style={{
              padding: "8px 0",
              borderTop: i > 0 ? "1px solid var(--color-divider)" : undefined,
              opacity: step.at ? 1 : 0.4,
            }}
          >
            <span style={{ fontSize: 13 }}>{step.label}</span>
            <span style={{ fontSize: 12, fontFamily: "var(--font-heading)" }}>{fmt(step.at)}</span>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 16, margin: "28px 0 10px" }}>Réponses onboarding</h2>
      <div className="card elev-sm flex flex-col gap-2.5" style={{ padding: "var(--space-4) var(--space-5)" }}>
        {[
          ["Ville", profile.city],
          ["Mobilité", profile.mobility],
          ["Cherche", profile.looking_for?.join(", ")],
          ["Niveau d'études", profile.education_level],
          ["Formation", profile.formation],
          ["Expérience", profile.experience_level],
          ["Compétences", profile.skills?.join(", ")],
          ["Secteurs", profile.sectors?.join(", ")],
          ["Métiers recherchés", profile.target_jobs?.join(", ")],
          ["Disponible à partir de", profile.availability_date],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between" style={{ fontSize: 13 }}>
            <span style={{ color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>{label}</span>
            <span style={{ fontWeight: 600, textAlign: "right" }}>{value || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
