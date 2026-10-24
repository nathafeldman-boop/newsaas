import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPremium } from "@/lib/subscription/isPremium";
import { grantPremiumAndNotifyAction, syncUserPaymentsAction } from "@/app/admin/users/actions";
import { requireAdminPage } from "@/lib/admin/accessCode";
import { STATUS_LABELS } from "@/lib/applications/status";
import { isAutoTier } from "@/lib/subscription/isPremium";
import { Chip, MiniHistogram, Steps } from "@/components/admin/cockpit/Visual";
import { sourceInfo, dayKey, daysBetween } from "@/lib/admin/trafficStats";
import { heardFromLabel } from "@/lib/onboarding/options";
import { nowMs } from "@/lib/admin/cockpit/load";

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
  paywall_viewed: "Page Premium vue",
  checkout_opened: "Paiement ouvert",
  heard_from: "Nous a connus par",
};

// Temps écoulé entre deux étapes du parcours, en clair.
function gapText(fromIso: string, toIso: string): string {
  const mins = Math.max(0, Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 60000));
  if (mins < 1) return "moins d'1 min";
  if (mins < 60) return `${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} h`;
  return `${Math.round(hours / 24)} j`;
}

const APPLICATION_STATUS_LABEL: Record<string, string> = STATUS_LABELS;

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
  if (eventType === "heard_from" && typeof metadata.source === "string") {
    return heardFromLabel(metadata.source, typeof metadata.format === "string" ? metadata.format : null);
  }
  if (eventType === "paywall_viewed" && typeof metadata.source === "string") return `depuis ${metadata.source}`;
  if (eventType === "checkout_opened" && typeof metadata.plan === "string") return `formule ${metadata.plan}`;
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

const LTV_MESSAGES: Record<string, string> = {
  ok: "Paiements Stripe relus et crédités.",
  no_customer: "Aucun client Stripe trouvé pour ce compte.",
  error: "La base n'a pas répondu pour au moins un paiement : réessaie dans une minute.",
};

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ltv?: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const { ltv } = await searchParams;
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

  // Parcours (25/10) : chaque étape cochée avec sa date, du compte au paiement.
  const firstOf = (type: string) => {
    const list = allEvents.filter((e) => e.event_type === type);
    return list.length > 0 ? list[list.length - 1].created_at : null;
  };
  const countOf = (type: string) => allEvents.filter((e) => e.event_type === type).length;
  const firstSwipe = allSwipes.length > 0 ? allSwipes[allSwipes.length - 1].created_at : null;
  const firstLike = allSwipes.filter((x) => x.direction === "like").at(-1)?.created_at ?? null;
  const firstApplication = allApplications.length > 0 ? allApplications[allApplications.length - 1].applied_at : null;
  const paywallSeen = firstOf("paywall_viewed");
  const checkoutOpened = firstOf("checkout_opened");
  const paid = profile.premium_activated_at;
  const heard = allEvents.find((e) => e.event_type === "heard_from");
  const heardMeta = heard?.metadata as { source?: unknown; format?: unknown } | null | undefined;
  const heardText = typeof heardMeta?.source === "string" ? heardFromLabel(heardMeta.source, typeof heardMeta.format === "string" ? heardMeta.format : null) : null;
  const steps = [
    { label: "Compte créé", done: true, at: profile.created_at, detail: profile.utm_source ? `via ${sourceInfo(profile.utm_source).label}` : "source inconnue" },
    { label: "Onboarding fini", done: !!profile.onboarding_completed, at: profile.onboarding_completed_at },
    { label: "1er swipe", done: !!firstSwipe, at: firstSwipe, detail: allSwipes.length > 0 ? `${allSwipes.length} swipe${allSwipes.length > 1 ? "s" : ""}` : undefined },
    { label: "1er like", done: !!firstLike, at: firstLike },
    { label: "Page Premium vue", done: !!paywallSeen, at: paywallSeen, detail: paywallSeen ? `${countOf("paywall_viewed")} fois` : undefined },
    { label: "Paiement ouvert", done: !!checkoutOpened, at: checkoutOpened, detail: checkoutOpened ? `${countOf("checkout_opened")} fois` : undefined },
    { label: "A payé", done: isPremium(profile) || (profile.total_paid_cents ?? 0) > 0, at: paid },
    { label: "1re candidature", done: !!firstApplication, at: firstApplication },
  ];

  // Activité des 14 derniers jours : swipes + actions enregistrées, par jour.
  const now = nowMs();
  const recentDays = daysBetween(now - 13 * 86_400_000, now);
  const perDay = new Map<string, number>();
  for (const at of [...allSwipes.map((x) => x.created_at), ...allEvents.map((e) => e.created_at)]) {
    const k = dayKey(Date.parse(at));
    perDay.set(k, (perDay.get(k) ?? 0) + 1);
  }
  const onlineNow = !!profile.last_active_at && now - Date.parse(profile.last_active_at) < 3 * 60_000;

  // Titres/entreprises des offres swipées ou candidatées : un seul lookup
  // groupé plutôt qu'une requête par ligne.
  // + l'offre derrière un clic Premium bloqué (like, 4e swipe, candidater),
  // pour voir si c'est toujours la même offre ou plusieurs.
  const eventOfferIds = allEvents
    .map((e) => (e.metadata as Record<string, unknown> | null)?.offerId)
    .filter((id): id is string => typeof id === "string");
  const offerIds = [
    ...new Set([...allSwipes.map((s) => s.offer_id), ...allApplications.map((a) => a.offer_id), ...eventOfferIds]),
  ];
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
    const metadata = e.metadata as Record<string, unknown> | null;
    const offer = typeof metadata?.offerId === "string" ? offerById.get(metadata.offerId) : undefined;
    timeline.push({
      at: e.created_at,
      tag: "event",
      label: EVENT_LABEL[e.event_type] ?? e.event_type,
      detail: describeEvent(e.event_type, metadata) + (offer ? ` · offre : ${offer.title} — ${offer.company}` : ""),
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

      {ltv && LTV_MESSAGES[ltv] && (
        <p className="card" style={{ padding: "var(--space-3)", margin: "12px 0 0", fontSize: 13 }}>
          {LTV_MESSAGES[ltv]}
        </p>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
        {onlineNow && (
          <Chip tone="good">
            <span className="live-dot" aria-hidden /> en ligne
          </Chip>
        )}
        {isAutoTier(profile) ? <Chip tone="violet">Stageio Auto</Chip> : isPremium(profile) ? <Chip tone="good">Premium</Chip> : <Chip>Gratuit</Chip>}
        {profile.utm_source && <Chip tone="blue">Arrivé via {sourceInfo(profile.utm_source).label}</Chip>}
        {heardText && <Chip tone="violet">Dit nous avoir connus par : {heardText}</Chip>}
        {profile.city && <Chip>{profile.city}</Chip>}
        <Chip>Inscrit le {fmt(profile.created_at)}</Chip>
        {profile.last_active_at && !onlineNow && <Chip>Vu le {fmt(profile.last_active_at)}</Chip>}
      </div>

      <h2 style={{ fontSize: 16, margin: "24px 0 10px" }}>Son parcours</h2>
      <Steps steps={steps} formatDate={(iso) => fmt(iso)} gap={gapText} />

      <h2 style={{ fontSize: 16, margin: "24px 0 10px" }}>Son activité sur 14 jours</h2>
      <div className="cockpit-card">
        <MiniHistogram
          values={recentDays.map((d) => perDay.get(d.key) ?? 0)}
          labels={recentDays.map((d) => `${d.key.slice(8, 10)}/${d.key.slice(5, 7)}`)}
          color="#0f9c56"
          title="Actions par jour sur 14 jours"
        />
      </div>

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
        {(profile.total_paid_cents ?? 0) === 0 && (profile.stripe_customer_id || isPremium(profile)) && (
          <form action={syncUserPaymentsAction}>
            <input type="hidden" name="userId" value={profile.id} />
            <button type="submit" className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
              LTV à 0 € → Récupérer les paiements depuis Stripe
            </button>
          </form>
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
