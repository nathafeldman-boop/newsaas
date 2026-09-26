import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPremium } from "@/lib/subscription/isPremium";
import { grantPremiumAndNotifyAction } from "@/app/admin/users/actions";

const SUBSCRIPTION_LABEL: Record<string, string> = {
  active: "Payant (actif)",
  trialing: "Payant (essai)",
  comp: "Offert (code d'accès)",
  lifetime: "Payant (à vie)",
  past_due: "Impayé",
  canceled: "Annulé",
};

const EVENT_LABEL: Record<string, string> = {
  button_click: "Clic bouton",
  login: "Connexion",
  onboarding_step_viewed: "Étape onboarding vue",
  onboarding_step_completed: "Étape onboarding terminée",
};

const APPLICATION_STATUS_LABEL: Record<string, string> = {
  envoyee: "Envoyée",
  en_cours: "En cours",
  entretien: "Entretien",
  acceptee: "Acceptée",
  refusee: "Refusée",
};

function describeEvent(eventType: string, metadata: Record<string, unknown> | null): string {
  if (!metadata) return "";
  if (eventType === "button_click") {
    const button = typeof metadata.button === "string" ? metadata.button : "?";
    const source = typeof metadata.source === "string" ? ` · source: ${metadata.source}` : "";
    const path = typeof metadata.path === "string" ? ` · depuis ${metadata.path}` : "";
    return `${button}${source}${path}`;
  }
  if (eventType === "onboarding_step_viewed" || eventType === "onboarding_step_completed") {
    return typeof metadata.step === "string" ? `étape: ${metadata.step}` : "";
  }
  return "";
}

function fmt(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  });
}

type TimelineItem = {
  at: string;
  tag: "milestone" | "swipe" | "candidature" | "event";
  label: string;
  detail: string;
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  // Requêtes toutes filtrées sur ce seul user_id (index dédiés sur chaque
  // table) -- jamais un risque de retomber sur la limite 1000 lignes de
  // l'API Supabase qui avait tronqué le calcul de LTV côté /admin.
  const [{ data: profile }, { data: swipes }, { data: applications }, { data: events }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", id).maybeSingle(),
    admin
      .from("swipes")
      .select("id, offer_id, direction, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(1000),
    admin
      .from("applications")
      .select("id, offer_id, status, applied_at")
      .eq("user_id", id)
      .order("applied_at", { ascending: false })
      .limit(1000),
    admin
      .from("user_events")
      .select("id, event_type, metadata, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);

  if (!profile) notFound();

  const allSwipes = swipes ?? [];
  const allApplications = applications ?? [];
  const allEvents = events ?? [];
  const loginCount = allEvents.filter((e) => e.event_type === "login").length;

  // Titres/entreprises des offres swipées ou candidatées : un seul lookup
  // groupé plutôt qu'une requête par ligne.
  const offerIds = [...new Set([...allSwipes.map((s) => s.offer_id), ...allApplications.map((a) => a.offer_id)])];
  const offerById = new Map<string, { title: string; company: string }>();
  if (offerIds.length > 0) {
    const { data: offers, error: offersError } = await admin
      .from("offers")
      .select("id, title, company")
      .in("id", offerIds);
    if (offersError) {
      console.error("AdminUserDetailPage: offers query failed", offersError);
    } else {
      for (const o of offers ?? []) offerById.set(o.id, o);
    }
  }

  // Timeline unique et complète : tout ce que ce compte a fait (pas
  // seulement les 4-5 jalons du funnel), fusionné et trié du plus récent
  // au plus ancien -- swipes, candidatures, connexions, clics, onboarding
  // et les jalons de compte, tous mélangés dans l'ordre réel des événements.
  const timeline: TimelineItem[] = [];

  timeline.push({ at: profile.created_at, tag: "milestone", label: "Inscription", detail: "" });
  if (profile.onboarding_completed_at) {
    timeline.push({ at: profile.onboarding_completed_at, tag: "milestone", label: "Onboarding terminé", detail: "" });
  }
  if (profile.premium_activated_at) {
    timeline.push({ at: profile.premium_activated_at, tag: "milestone", label: "Passage Premium", detail: "" });
  }
  for (const s of allSwipes) {
    const offer = offerById.get(s.offer_id);
    timeline.push({
      at: s.created_at,
      tag: "swipe",
      label: s.direction === "like" ? "Swipe · j'aime" : "Swipe · passe",
      detail: offer ? `${offer.title} — ${offer.company}` : "offre supprimée",
    });
  }
  for (const a of allApplications) {
    const offer = offerById.get(a.offer_id);
    timeline.push({
      at: a.applied_at,
      tag: "candidature",
      label: `Candidature · ${APPLICATION_STATUS_LABEL[a.status] ?? a.status}`,
      detail: offer ? `${offer.title} — ${offer.company}` : "offre supprimée",
    });
  }
  for (const e of allEvents) {
    timeline.push({
      at: e.created_at,
      tag: "event",
      label: EVENT_LABEL[e.event_type] ?? e.event_type,
      detail: describeEvent(e.event_type, e.metadata as Record<string, unknown> | null),
    });
  }
  timeline.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const TAG_CLASS: Record<TimelineItem["tag"], string> = {
    milestone: "tag tag-accent",
    swipe: "tag tag-neutral",
    candidature: "tag tag-accent-2",
    event: "tag tag-neutral",
  };

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
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 22, margin: 0 }}>{loginCount}</p>
          <p style={{ fontSize: 11, textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 65%, transparent)", margin: "4px 0 0" }}>
            Sessions
          </p>
        </div>
        <div className="card elev-sm" style={{ padding: "var(--space-4)" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 22, margin: 0 }}>{allSwipes.length}</p>
          <p style={{ fontSize: 11, textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 65%, transparent)", margin: "4px 0 0" }}>
            Swipes
          </p>
        </div>
        <div className="card elev-sm" style={{ padding: "var(--space-4)" }}>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 22, margin: 0 }}>{allApplications.length}</p>
          <p style={{ fontSize: 11, textTransform: "uppercase", color: "color-mix(in srgb, var(--color-text) 65%, transparent)", margin: "4px 0 0" }}>
            Candidatures
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className={isPremium(profile) ? "tag tag-accent" : "tag tag-neutral"}>
          {SUBSCRIPTION_LABEL[profile.subscription_status ?? ""] ?? "Gratuit"}
        </span>
        {profile.last_active_path && (
          <span className="tag tag-neutral" style={{ fontFamily: "monospace" }}>
            actuellement sur {profile.last_active_path}
          </span>
        )}
        {!isPremium(profile) && (
          <form action={grantPremiumAndNotifyAction}>
            <input type="hidden" name="userId" value={profile.id} />
            <button type="submit" className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
              A payé mais pas activé → Marquer Premium + prévenir
            </button>
          </form>
        )}
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

      <h2 style={{ fontSize: 16, margin: "28px 0 10px" }}>
        Tout l&apos;historique ({timeline.length})
      </h2>
      <p style={{ fontSize: 12, margin: "-4px 0 10px", color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
        Inscription, swipes, candidatures, connexions, clics et étapes d&apos;onboarding, du plus récent au plus
        ancien.
      </p>
      <div className="card elev-sm" style={{ padding: 0, overflow: "hidden" }}>
        {timeline.length === 0 ? (
          <p style={{ fontSize: 13, padding: "var(--space-4) var(--space-5)", color: "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>
            Aucun événement enregistré.
          </p>
        ) : (
          <div className="flex flex-col">
            {timeline.map((item, i) => (
              <div
                key={`${item.tag}-${item.at}-${i}`}
                className="flex items-center justify-between gap-3"
                style={{
                  padding: "10px var(--space-5)",
                  borderTop: i > 0 ? "1px solid var(--color-divider)" : undefined,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <span className={TAG_CLASS[item.tag]} style={{ marginRight: 8 }}>
                    {item.label}
                  </span>
                  {item.detail && (
                    <span style={{ fontSize: 12.5, fontFamily: "monospace", color: "color-mix(in srgb, var(--color-text) 70%, transparent)" }}>
                      {item.detail}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 12, flexShrink: 0 }}>{fmt(item.at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
