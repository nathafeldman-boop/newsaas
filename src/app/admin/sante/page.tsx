import Link from "next/link";
import type { ReactNode } from "react";
import { Card, Section } from "@/components/admin/cockpit/Kpi";
import { PeriodBar } from "@/components/admin/cockpit/PeriodBar";
import { premiumProfiles, profilesByIds } from "@/lib/admin/cockpit/db";
import { date, euros, maskEmail } from "@/lib/admin/cockpit/format";
import { loadSnapshot, nowMs } from "@/lib/admin/cockpit/load";
import { DAY_MS, activeAt, duplicateSubs, firstPaidBySub, paidSubs, refusedNotClosed } from "@/lib/admin/cockpit/metrics";
import { requireAdminPage } from "@/lib/admin/accessCode";
import { syncUserPaymentsAction } from "@/app/admin/users/actions";

// Santé des paiements et qualité des données : écarts entre Stripe (vérité
// des paiements) et Supabase (vérité des comptes et des accès), impayés,
// litiges, et la carte des sources de chaque métrique du cockpit.
export const maxDuration = 60;

type Check = { title: string; tone: "is-good" | "is-warn" | "is-bad"; detail: string; rows: { userId: string | null; text: string; recover?: boolean }[] };

const SOURCES: [string, string, string][] = [
  ["MRR, abonnements, renouvellements, churn", "Stripe (abonnements, factures)", "Instantané relu à chaque paiement reçu (webhook), toutes les 10 min sinon (bouton Actualiser)"],
  ["Encaissements, remboursements, litiges", "Stripe (factures, sessions, remboursements, litiges)", "Tout le compte Stripe est à Stageio : chaque paiement compte"],
  ["Accès Premium dans l'appli", "Supabase (profiles.subscription_status, mis à jour par le webhook Stripe)", "Comparé à Stripe ci-dessous"],
  ["LTV par compte (profiles.total_paid_cents)", "Supabase, crédité par le webhook (registre idempotent)", "Diffère de Stripe si un webhook a échoué"],
  ["Inscriptions, dernière activité", "Supabase (profiles.created_at, last_active_at)", "Seule la dernière activité est gardée : pas d'historique d'actifs par jour"],
  ["Likes, candidatures", "Supabase (swipes, applications)", ""],
  ["Événements produit (paywall, connexions, clics)", "Supabase (user_events)", ""],
  ["E-mails envoyés par les campagnes", "Supabase (user_events, registre d'envoi)", "Ouvertures et rebonds : non lus (clé Resend en envoi seul)"],
  ["Motifs d'annulation", "Stripe (portail) + Supabase (subscription_cancellations)", "Facultatifs pour le client"],
  [
    "Synchronisation Stripe → base (webhook)",
    "Événements reçus (vérifié le 24/10) : checkout.session.completed, customer.subscription.updated / deleted, invoice.paid",
    "Non reçus : remboursements (charge.refunded) et litiges (charge.dispute.created) → le LTV en base ne baisse pas après un remboursement ; le cockpit les lit dans Stripe. Rattrapage quotidien : cron reconcile-subscriptions.",
  ],
];

const LTV_RESULT: Record<string, string> = {
  ok: "✓ Paiements recopiés depuis Stripe. Si le cas reste listé, recharger dans une minute.",
  no_customer: "Aucun client Stripe trouvé pour ce compte : rien à recopier.",
  error: "La récupération a échoué en partie : réessayer, ou voir la fiche du compte.",
};

export default async function SantePage({ searchParams }: { searchParams: Promise<{ ltv?: string }> }) {
  const { ltv } = await searchParams;
  await requireAdminPage();
  const now = nowMs();
  const { snap, error } = await loadSnapshot();
  if (!snap) {
    return (
      <Card>
        <p style={{ margin: 0 }}>Lecture Stripe impossible pour l&apos;instant ({error}).</p>
      </Card>
    );
  }
  const firstPaid = firstPaidBySub(snap.invoices);
  const paid = paidSubs(snap, firstPaid);
  const live = paid.filter((s) => activeAt(s, now));
  const healthyLive = live.filter((s) => s.status !== "past_due" && s.status !== "unpaid");
  const payerIds = [...new Set([...paid.map((s) => s.userId), ...snap.oneTime.map((o) => o.userId)].filter((id): id is string => !!id))];
  const [profiles, dbPremium] = await Promise.all([profilesByIds(payerIds).catch(() => null), premiumProfiles().catch(() => null)]);

  const checks: Check[] = [];

  if (profiles) {
    const missing = payerIds.filter((id) => (profiles.get(id)?.total_paid_cents ?? 0) <= 0);
    checks.push({
      title: "Payeurs Stripe sans paiement noté en base",
      tone: missing.length ? "is-warn" : "is-good",
      detail: "Paiement réussi dans Stripe mais LTV à 0 dans Supabase : webhook manqué ou arrivé avant le lien du client. « Récupérer depuis Stripe » ci-dessous recopie ses paiements (sans doublon).",
      rows: missing.map((id) => ({ userId: id, text: "LTV 0 € en base", recover: true })),
    });
  }

  if (profiles) {
    // LTV en base comparé au payé dans Stripe (brut : la base ne déduit pas les remboursements).
    const subUser = new Map(snap.subs.map((s) => [s.id, s.userId]));
    const grossByUser = new Map<string, number>();
    const add = (id: string | null | undefined, cents: number) => {
      if (id) grossByUser.set(id, (grossByUser.get(id) ?? 0) + cents);
    };
    for (const inv of snap.invoices) if (inv.subscription && inv.status === "paid") add(subUser.get(inv.subscription), inv.amountPaid);
    for (const o of snap.oneTime) add(o.userId, o.amountCents);
    const drift = payerIds
      .map((id) => ({ id, db: profiles.get(id)?.total_paid_cents ?? 0, stripe: grossByUser.get(id) ?? 0 }))
      .filter((x) => x.db > 0 && x.db !== x.stripe);
    checks.push({
      title: "LTV en base différent du payé dans Stripe",
      tone: drift.length ? "is-warn" : "is-good",
      detail: "Compte par compte : total payé noté en base contre total payé dans Stripe (brut, remboursements non déduits des deux côtés). Plus en base = paiement compté deux fois ; moins = paiement manqué.",
      rows: drift.map((x) => ({ userId: x.id, text: `base ${euros(x.db)} · Stripe ${euros(x.stripe)} (${x.db > x.stripe ? "+" : "−"}${euros(Math.abs(x.db - x.stripe))})` })),
    });
  }

  if (dbPremium) {
    const liveUsers = new Set(healthyLive.map((s) => s.userId));
    const lifetimeUsers = new Set(snap.oneTime.map((o) => o.userId));
    const dbActive = dbPremium.filter((p) => (p.subscription_status === "active" || p.subscription_status === "trialing") && p.current_period_end && Date.parse(p.current_period_end) > now);
    const ghost = dbActive.filter((p) => !liveUsers.has(p.id));
    checks.push({
      title: "Accès Premium en base sans abonnement Stripe en cours",
      tone: ghost.length ? "is-bad" : "is-good",
      detail: "La base donne l'accès (statut actif, période non échue) mais Stripe n'a aucun abonnement en cours à jour pour ce compte. Le bouton de vérification Stripe de la fiche resynchronise.",
      rows: ghost.map((p) => ({ userId: p.id, text: `Statut ${p.subscription_status}, période jusqu'au ${date(Date.parse(p.current_period_end!))}` })),
    });
    const dbPaying = new Set(dbPremium.filter((p) => p.subscription_status !== "past_due").map((p) => p.id));
    const unsynced = healthyLive.filter((s) => s.userId && !dbPaying.has(s.userId));
    checks.push({
      title: "Abonnés Stripe sans accès Premium en base",
      tone: unsynced.length ? "is-bad" : "is-good",
      detail: "Abonnement payé et en cours dans Stripe, mais la base ne donne pas l'accès : client qui paie sans pouvoir utiliser Stageio.",
      rows: unsynced.map((s) => ({ userId: s.userId, text: `Abonnement ${s.id} (${s.status})` })),
    });
    const lifetimeNoStripe = dbPremium.filter((p) => p.subscription_status === "lifetime" && !lifetimeUsers.has(p.id));
    checks.push({
      title: "Accès à vie en base sans achat Stripe retrouvé",
      tone: lifetimeNoStripe.length ? "is-warn" : "is-good",
      detail: "Statut « lifetime » sans session de paiement à vie depuis le 1er août 2026 : achat plus ancien, accès donné à la main, ou écart à vérifier.",
      rows: lifetimeNoStripe.map((p) => ({ userId: p.id, text: "lifetime sans paiement retrouvé" })),
    });
  }

  const pastDue = paid.filter((s) => refusedNotClosed(s, now) || (activeAt(s, now) && (s.status === "past_due" || s.status === "unpaid")));
  checks.push({
    title: "Abonnements en impayé",
    tone: pastDue.length ? "is-bad" : "is-good",
    detail: "Renouvellement refusé : compté comme un départ (hors abonnés et MRR) tant qu'il n'est pas payé. Stripe retente selon les réglages du compte (partagé : non modifiés ici).",
    rows: pastDue.map((s) => ({ userId: s.userId, text: `${s.status}, échéance ${date(s.currentPeriodEnd)}` })),
  });

  const dups = duplicateSubs(paid, now);
  checks.push({
    title: "Clients avec plusieurs abonnements en cours",
    tone: dups.length ? "is-warn" : "is-good",
    detail: "Deux abonnements actifs pour le même client Stripe : double prélèvement probable.",
    rows: dups.map((d) => ({ userId: d.userId, text: d.ids.join(", ") })),
  });

  const recentDisputes = snap.disputes.filter((d) => d.created >= now - 90 * DAY_MS);
  checks.push({
    title: "Litiges bancaires (90 jours)",
    tone: recentDisputes.length ? "is-bad" : "is-good",
    detail: "Contestations de paiement auprès de la banque du client.",
    rows: recentDisputes.map((d) => ({ userId: null, text: `${date(d.created)} · ${euros(d.amount)} · ${d.status}` })),
  });

  if (snap.otherCurrencySubs > 0) {
    checks.push({ title: "Abonnements dans une autre devise", tone: "is-warn", detail: "Exclus du MRR (en euros).", rows: [] });
  }

  const emails = profiles ?? new Map();
  const userLink = (id: string | null): ReactNode => (id ? <Link href={`/admin/users/${id}`}>{maskEmail(emails.get(id)?.email ?? dbPremium?.find((p) => p.id === id)?.email ?? null)}</Link> : "—");

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Santé et données</h1>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--color-neutral-600)" }}>
        Les écarts entre Stripe et la base, les paiements à surveiller, et d&apos;où vient chaque chiffre du cockpit.
      </p>
      <PeriodBar path="/admin/sante" computedAt={snap.computedAt} />
      {ltv && LTV_RESULT[ltv] && (
        <p className="cockpit-card" style={{ margin: "12px 0 0", fontSize: 13, fontWeight: 600 }}>
          {LTV_RESULT[ltv]}
        </p>
      )}

      <Section title="Contrôles">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {checks.map((c) => (
            <div key={c.title} className="cockpit-card">
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span className={`cockpit-pill ${c.tone}`}>
                  <span aria-hidden>{c.tone === "is-good" ? "✓" : c.tone === "is-warn" ? "!" : "✕"}</span>
                  {c.tone === "is-good" ? "OK" : `${c.rows.length || ""} à vérifier`}
                </span>
                <strong style={{ fontSize: 14 }}>{c.title}</strong>
              </div>
              <p style={{ fontSize: 12.5, color: "var(--color-neutral-600)", margin: "6px 0 0" }}>{c.detail}</p>
              {c.rows.length > 0 && (
                <details style={{ marginTop: 6 }} open={c.rows.some((r) => r.recover)}>
                  <summary style={{ cursor: "pointer", fontSize: 12.5 }}>Voir les {c.rows.length} cas</summary>
                  <table className="cockpit-table" style={{ marginTop: 6 }}>
                    <tbody>
                      {c.rows.slice(0, 200).map((r, i) => (
                        <tr key={i}>
                          <td>{userLink(r.userId)}</td>
                          <td>{r.text}</td>
                          {r.recover && r.userId && (
                            <td>
                              <form action={syncUserPaymentsAction}>
                                <input type="hidden" name="userId" value={r.userId} />
                                <input type="hidden" name="back" value="/admin/sante" />
                                <button type="submit" className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: 12 }}>
                                  Récupérer depuis Stripe
                                </button>
                              </form>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Sources de vérité">
        <div className="cockpit-card cockpit-scroll" style={{ padding: 0 }}>
          <table className="cockpit-table">
            <thead>
              <tr>
                <th>Chiffre</th>
                <th>Source</th>
                <th>Limite</th>
              </tr>
            </thead>
            <tbody>
              {SOURCES.map(([what, source, limit]) => (
                <tr key={what}>
                  <td style={{ whiteSpace: "normal" }}>{what}</td>
                  <td style={{ whiteSpace: "normal" }}>{source}</td>
                  <td style={{ whiteSpace: "normal", color: "var(--color-neutral-600)" }}>{limit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Définitions">
        <div className="cockpit-card" style={{ fontSize: 13, lineHeight: 1.55 }}>
          <p style={{ margin: "0 0 8px" }}>
            <strong>Client abonné</strong> : abonnement avec au moins une facture payée (&gt; 0 €), de son début jusqu&apos;à sa fin réelle. Une résiliation programmée reste
            cliente jusqu&apos;à l&apos;échéance payée.
          </p>
          <p style={{ margin: "0 0 8px" }}>
            <strong>MRR</strong> : montant des abonnements en cours et à jour, ramené au mois (hebdomadaire × 52 / 12, annuel / 12, remises récurrentes déduites), en
            euros. Exclut impayés, pauses et accès à vie. La courbe historique compte tout abonnement en cours à chaque date, impayés compris : l&apos;historique des
            impayés n&apos;est pas reconstituable. Suivi fiable à partir du 1er août 2026 (début de la lecture Stripe).
          </p>
          <p style={{ margin: "0 0 8px" }}>
            <strong>Churn client</strong> : abonnés au premier jour de la période et terminés pendant celle-ci, divisés par les abonnés du premier jour.{" "}
            <strong>Churn de revenu</strong> : leur MRR divisé par le MRR du premier jour. Volontaire = résiliation demandée ; impayé = arrêt par Stripe après échec
            de paiement ou litige.
          </p>
          <p style={{ margin: "0 0 8px" }}>
            <strong>Renouvellement</strong> : échéance n° k = date de facturation de départ + k périodes (même jour du mois, ramené au dernier jour si besoin).
            Réussi = facture de renouvellement payée à ± 3 jours ; échoué = facture tentée et impayée ; annulé avant = abonnement terminé ou résiliation
            programmée avant l&apos;échéance. Taux de renouvellement = réussis / échéances passées.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Encaissé</strong> : factures d&apos;abonnement payées et achats à vie, brut. <strong>Net</strong> : encaissé − remboursements. Frais Stripe non lus.
          </p>
        </div>
      </Section>
    </div>
  );
}
