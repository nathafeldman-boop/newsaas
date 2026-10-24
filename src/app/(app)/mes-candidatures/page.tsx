import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApplicationsBoard, type TrackedApplication } from "@/components/candidature/ApplicationsBoard";
import { ownOffersByIds } from "@/lib/applications/ownOffers";
import { STATUS_LABELS, followUpAt, requestNow } from "@/lib/applications/status";
import type { ApplicationStatus } from "@/types/database";

// Suivi des candidatures (refait le 24/10, mission churn) : avant, une
// candidature dont l'offre avait expiré disparaissait de la liste (règle RLS
// des offres actives), et rien ne disait quoi faire ensuite. Voir
// ApplicationsBoard pour l'écran.

const HISTORY_EVENTS = ["application_status_changed", "application_marked_sent", "application_tracking_updated"];

type HistoryEvent = { event_type: string; metadata: Record<string, unknown> | null; created_at: string };

function historyLabel(e: HistoryEvent): string | null {
  const m = e.metadata ?? {};
  if (e.event_type === "application_status_changed") {
    const label = STATUS_LABELS[m.status as ApplicationStatus];
    return label ? `Statut : ${label}` : null;
  }
  if (e.event_type === "application_marked_sent") return "Candidature envoyée";
  if (e.event_type === "application_tracking_updated") {
    const fields = Array.isArray(m.fields) ? m.fields : [];
    if (fields.includes("follow_up_at")) return "Date de relance modifiée";
    if (fields.includes("note")) return "Note mise à jour";
  }
  return null;
}

export default async function MesCandidaturesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/mes-candidatures");

  const [{ data: applications }, { data: profile }] = await Promise.all([
    supabase.from("applications").select("*").eq("user_id", user.id).order("applied_at", { ascending: false }),
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);
  const apps = applications ?? [];

  // Lecture des événements en service_role (pas de lecture côté étudiant
  // sur user_events), filtrée sur son propre compte.
  const [offers, { data: events }] = await Promise.all([
    ownOffersByIds(apps.map((a) => a.offer_id)).catch((err) => {
      console.error("mes-candidatures: offres illisibles", err);
      return [];
    }),
    apps.length
      ? createAdminClient()
          .from("user_events")
          .select("event_type, metadata, created_at")
          .eq("user_id", user.id)
          .in("event_type", HISTORY_EVENTS)
          .order("created_at", { ascending: false })
          .limit(1000)
      : Promise.resolve({ data: [] as HistoryEvent[] }),
  ]);
  const offerById = new Map(offers.map((o) => [o.id, o]));

  const historyByApp = new Map<string, { label: string; at: string }[]>();
  const appIdByOffer = new Map(apps.map((a) => [a.offer_id, a.id]));
  for (const e of [...((events ?? []) as HistoryEvent[])].reverse()) {
    const m = e.metadata ?? {};
    const appId = typeof m.applicationId === "string" ? m.applicationId : typeof m.offerId === "string" ? appIdByOffer.get(m.offerId) : undefined;
    const label = historyLabel(e);
    if (!appId || !label) continue;
    const list = historyByApp.get(appId) ?? [];
    list.push({ label, at: e.created_at });
    historyByApp.set(appId, list);
  }

  const trackingReady = apps.length > 0 && "follow_up_at" in apps[0];
  const items: TrackedApplication[] = apps.map((a) => {
    const offer = offerById.get(a.offer_id);
    return {
      id: a.id,
      offerId: a.offer_id,
      status: a.status,
      appliedAt: a.applied_at,
      sentAt: a.sent_at ?? null,
      followUpAt: a.follow_up_at ?? null,
      dueAt: followUpAt(a),
      note: a.note ?? null,
      offer: offer
        ? { title: offer.title, company: offer.company, location: offer.location, contractType: offer.contract_type, isActive: offer.is_active, applyUrl: offer.apply_url }
        : null,
      history: [{ label: "Ajoutée au suivi", at: a.applied_at }, ...(historyByApp.get(a.id) ?? [])].slice(-12),
    };
  });

  return (
    <div>
      <h1 style={{ fontSize: 30, margin: 0 }}>Mes candidatures</h1>
      <p style={{ fontSize: 14, color: "color-mix(in srgb, var(--color-text) 70%, transparent)", margin: "6px 0 0" }}>
        Prépare, envoie, relance : tout ton suivi au même endroit.
      </p>

      {items.length === 0 ? (
        <div className="card elev-sm mt-8" style={{ padding: "var(--space-6)", alignItems: "flex-start", background: "var(--color-surface)" }}>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5 }}>
            Pas encore de candidature. Ouvre une offre de tes favoris : ta lettre s&apos;écrit, et la candidature apparaît ici pour que tu la suives
            jusqu&apos;à la réponse.
          </p>
          <Link href="/favoris" className="btn btn-primary" style={{ marginTop: 8 }}>
            Mes favoris
          </Link>
        </div>
      ) : (
        <ApplicationsBoard items={items} now={requestNow()} trackingReady={trackingReady} fullName={profile?.full_name ?? null} />
      )}
    </div>
  );
}
