import Link from "next/link";
import { Card, Kpi, KpiGrid, Section } from "@/components/admin/cockpit/Kpi";
import { PeriodBar } from "@/components/admin/cockpit/PeriodBar";
import { getCancellationReasons, profilesByIds, usageByUser } from "@/lib/admin/cockpit/db";
import { date, delta, euros, int, maskEmail, monthRange, parsePeriod, pct, periodRanges } from "@/lib/admin/cockpit/format";
import { loadSnapshot, nowMs } from "@/lib/admin/cockpit/load";
import {
  DAY_MS,
  activeAt,
  churnIn,
  currentState,
  firstPaidBySub,
  movementIn,
  paidSubs,
  planLabel,
  renewalSummary,
  renewalsIn,
  type RenewalOutcome,
  endOf,
  refusedNotClosed,
} from "@/lib/admin/cockpit/metrics";
import type { SubRecord } from "@/lib/admin/cockpit/types";
import { requireAdminPage } from "@/lib/admin/accessCode";
import { createAdminClient } from "@/lib/supabase/admin";
import { KEEP_PREMIUM_EVENT } from "@/lib/stripe/keepPremium";
import { WINBACK_EVENT } from "@/lib/churn/outreach";
import { WINBACK_WINDOW_DAYS, winbackCandidates } from "@/lib/churn/candidates";
import { sendKeepPremiumRemindersAction, sendWinbackMessagesAction } from "./actions";

// Abonnements et churn : qui reste, qui part, quand et comment. Règles
// d'alerte fixes, modifiables ici.
export const maxDuration = 60;

const ALERT_RULES = {
  /** Payant sans activité depuis N jours. */
  inactiveDays: 7,
  /** Payant depuis N jours sans aucune candidature. */
  noApplicationAfterDays: 3,
  /** « Utilise très peu » : moins de N likes et aucune candidature après 7 jours. */
  lowUsageLikes: 3,
  /** « A commencé puis décroché » : au moins N candidatures, inactif depuis inactiveDays. */
  droppedAfterApplications: 2,
  /** Baisse d'usage : au moins N actions (swipes + candidatures) sur les 14 j d'avant… */
  usageDropMinBefore: 10,
  /** …et au plus cette part sur les 14 derniers jours. */
  usageDropRatio: 0.3,
};

const FEEDBACK_LABELS: Record<string, string> = {
  too_expensive: "Trop cher",
  unused: "Pas assez utilisé",
  missing_features: "Fonctionnalités manquantes",
  switched_service: "Passé à un autre service",
  too_complex: "Trop compliqué",
  low_quality: "Qualité insuffisante",
  customer_service: "Service client",
  other: "Autre",
};

type StatusKey = "actif" | "programme" | "impaye" | "termine";
const STATUS_LABELS: Record<StatusKey, string> = { actif: "En cours", programme: "Résiliation programmée", impaye: "Renouvellement refusé (parti)", termine: "Terminé" };

// Renouvellement refusé : compté comme parti (Nathan, 29/10), montré à part
// tant que Stripe réessaie.
function statusOf(s: SubRecord, now: number): StatusKey {
  if (refusedNotClosed(s, now)) return "impaye";
  if (!activeAt(s, now)) return "termine";
  if (s.status === "past_due" || s.status === "unpaid") return "impaye";
  if (s.cancelAt !== null || s.cancelAtPeriodEnd) return "programme";
  return "actif";
}

const OUTCOME_TONE: Record<RenewalOutcome, string> = {
  réussi: "is-good",
  échoué: "is-bad",
  "annulé avant l'échéance": "is-warn",
  "à venir": "",
  inconnu: "",
};

export default async function AbonnementsPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; mois?: string; statut?: string; formule?: string; activite?: string; rappel?: string; retour?: string }>;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const period = parsePeriod(params.p);
  const now = nowMs();
  const { current, previous } = periodRanges(period, now);
  const month = monthRange(params.mois, now);
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
  const state = currentState(paid, now);
  const chCur = churnIn(paid, current);
  const chPrev = churnIn(paid, previous);
  const mvCur = movementIn(snap, current, firstPaid);
  const mvPrev = movementIn(snap, previous, firstPaid);
  const renewals = renewalsIn(snap, month.range, now, firstPaid);
  const summary = renewalSummary(renewals);

  // Motifs : choix du portail Stripe (abonnements résiliés pendant la période) et formulaire Stageio.
  const feedback = new Map<string, number>();
  for (const s of paid) {
    if (s.canceledAt === null || s.canceledAt < current.start || s.canceledAt >= current.end) continue;
    const key = s.feedback ?? "non renseigné";
    feedback.set(key, (feedback.get(key) ?? 0) + 1);
  }
  const reasons = await getCancellationReasons(new Date(current.start).toISOString()).catch(() => null);

  // Tableau et alertes : profils et usage des clients.
  const userIds = paid.map((s) => s.userId).filter((id): id is string => !!id);
  const [profiles, usage] = await Promise.all([profilesByIds(userIds).catch(() => new Map()), usageByUser(userIds).catch(() => new Map())]);
  const lastActivity = (s: SubRecord) => {
    const p = s.userId ? profiles.get(s.userId) : undefined;
    const a = p?.last_active_at ? Date.parse(p.last_active_at) : null;
    const b = s.userId ? (usage.get(s.userId)?.lastSwipeAt ?? null) : null;
    return a === null ? b : b === null ? a : Math.max(a, b);
  };
  const cycleBySub = new Map<string, { paid: number; failed: number }>();
  for (const inv of snap.invoices) {
    if (!inv.subscription || inv.billingReason !== "subscription_cycle") continue;
    const c = cycleBySub.get(inv.subscription) ?? { paid: 0, failed: 0 };
    if (inv.status === "paid" && inv.amountPaid > 0) c.paid++;
    else if (inv.attemptCount > 0 && inv.status !== "draft") c.failed++;
    cycleBySub.set(inv.subscription, c);
  }

  const live = paid.filter((s) => activeAt(s, now));
  const alertList: { sub: SubRecord; text: string; tone: string }[] = [];
  // Abonnés en cours, plus les renouvellements refusés que Stripe réessaie encore.
  for (const s of paid.filter((x) => activeAt(x, now) || refusedNotClosed(x, now))) {
    const u = s.userId ? usage.get(s.userId) : undefined;
    const fp = firstPaid.get(s.id) ?? s.startDate;
    const last = lastActivity(s);
    const inactiveFor = last === null ? null : (now - last) / DAY_MS;
    const status = statusOf(s, now);
    if (status === "impaye") alertList.push({ sub: s, text: "Renouvellement refusé : compté comme parti, Stripe réessaie encore", tone: "is-bad" });
    if (status === "programme") alertList.push({ sub: s, text: `Résiliation programmée au ${date(s.cancelAt ?? s.currentPeriodEnd)}`, tone: "is-warn" });
    if (inactiveFor === null || inactiveFor >= ALERT_RULES.inactiveDays) {
      const dropped = (u?.applications ?? 0) >= ALERT_RULES.droppedAfterApplications;
      alertList.push({
        sub: s,
        text: dropped
          ? `A envoyé ${u?.applications} candidatures puis plus d'activité depuis ${inactiveFor === null ? "longtemps" : `${Math.floor(inactiveFor)} j`}`
          : `Inactif depuis ${inactiveFor === null ? "son paiement" : `${Math.floor(inactiveFor)} jours`}`,
        tone: "is-warn",
      });
    }
    if (u && u.prev14 >= ALERT_RULES.usageDropMinBefore && u.recent14 <= u.prev14 * ALERT_RULES.usageDropRatio && (inactiveFor === null || inactiveFor < ALERT_RULES.inactiveDays)) {
      alertList.push({ sub: s, text: `Utilisation en forte baisse : ${u.recent14} action(s) sur 14 j contre ${u.prev14} avant`, tone: "is-warn" });
    }
    if (now - fp >= ALERT_RULES.noApplicationAfterDays * DAY_MS && (u?.applications ?? 0) === 0) {
      alertList.push({
        sub: s,
        text: (u?.likes ?? 0) < ALERT_RULES.lowUsageLikes && now - fp >= 7 * DAY_MS ? "Utilise très peu Stageio (presque aucun like, aucune candidature)" : "Aucune candidature depuis son paiement",
        tone: "is-warn",
      });
    }
  }

  // Une ligne par client, alertes graves d'abord.
  const alertsBySub = new Map<string, { sub: SubRecord; items: { text: string; tone: string }[] }>();
  for (const a of alertList) {
    const row = alertsBySub.get(a.sub.id) ?? { sub: a.sub, items: [] };
    row.items.push({ text: a.text, tone: a.tone });
    alertsBySub.set(a.sub.id, row);
  }
  const alerts = [...alertsBySub.values()].sort(
    (a, b) => Number(b.items.some((i) => i.tone === "is-bad")) - Number(a.items.some((i) => i.tone === "is-bad")) || b.items.length - a.items.length,
  );

  // Filtres du tableau.
  const statusFilter = (Object.keys(STATUS_LABELS) as StatusKey[]).find((k) => k === params.statut) ?? null;
  const planFilter = params.formule ?? null;
  const inactiveOnly = params.activite === "inactif";
  const plans = [...new Set(paid.map((s) => planLabel(s)))];
  const tableRows = paid
    .filter((s) => !statusFilter || statusOf(s, now) === statusFilter)
    .filter((s) => !planFilter || planLabel(s) === planFilter)
    .filter((s) => {
      if (!inactiveOnly) return true;
      const last = lastActivity(s);
      return last === null || now - last >= ALERT_RULES.inactiveDays * DAY_MS;
    })
    .sort((a, b) => (firstPaid.get(b.id) ?? 0) - (firstPaid.get(a.id) ?? 0));

  const qs = (patch: Record<string, string | null>) => {
    const base: Record<string, string> = { p: String(period), mois: month.key };
    if (statusFilter) base.statut = statusFilter;
    if (planFilter) base.formule = planFilter;
    if (inactiveOnly) base.activite = "inactif";
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) delete base[k];
      else base[k] = v;
    }
    return `/admin/abonnements?${new URLSearchParams(base).toString()}`;
  };
  // Mois avec des données (lecture Stripe depuis le 1er août 2026) et le mois prochain.
  const firstMonth = new Date(snap.since).toISOString().slice(0, 7);
  const months = [-5, -4, -3, -2, -1, 0, 1]
    .map((offset) => {
      const d = new Date(now);
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offset, 15)).toISOString().slice(0, 7);
    })
    .filter((m) => m >= firstMonth);
  // Rappel « Garder mon Premium » : abonnés à résiliation programmée pas encore prévenus.
  const scheduledSubs = paid.filter((s) => s.userId && statusOf(s, now) === "programme");
  const departed = winbackCandidates(snap, now);
  const [{ data: reminded }, { data: wonBack }] = await Promise.all([
    createAdminClient()
      .from("user_events")
      .select("metadata")
      .eq("event_type", KEEP_PREMIUM_EVENT)
      .in("user_id", [...new Set(scheduledSubs.map((s) => s.userId!))])
      .limit(2000),
    createAdminClient()
      .from("user_events")
      .select("user_id")
      .eq("event_type", WINBACK_EVENT)
      .in("user_id", departed.map((d) => d.userId))
      .limit(2000),
  ]);
  const remindedSubs = new Set((reminded ?? []).map((e) => (e.metadata as { subscriptionId?: string } | null)?.subscriptionId));
  const toRemind = scheduledSubs.filter((s) => !remindedSubs.has(s.id)).length;
  const wonBackUsers = new Set((wonBack ?? []).map((e) => e.user_id));
  const toWinBack = departed.filter((d) => !wonBackUsers.has(d.userId)).length;
  const [sentNow, skippedNow] = (params.rappel ?? "").split("-").map(Number);
  const [winSent, winSkipped] = (params.retour ?? "").split("-").map(Number);
  const monthName = (key: string) => new Date(`${key}-15T12:00:00Z`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Abonnements et churn</h1>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--color-neutral-600)" }}>
        Combien de clients Stageio garde, quand ils partent, et lesquels sont en train de décrocher.
      </p>
      {scheduledSubs.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Card title={`${scheduledSubs.length} résiliation(s) programmée(s) : le message de Nathan`}>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
              Un e-mail signé Nathan : la date de fin, le questionnaire « pourquoi j&apos;arrête », des compromis (garder Premium un mois de plus au même prix, accès à vie, rester en gratuit, réponse perso), les
              nouveautés, et « on continue le mois prochain ? ». Envoyé automatiquement à chaque nouvelle résiliation ; ce bouton sert pour celles d&apos;avant. Une seule fois par abonnement.
            </p>
            {params.rappel === "erreur" ? (
              <p style={{ margin: "8px 0 0", fontSize: 13, color: "#b42318" }}>Lecture Stripe impossible, rien n&apos;a été envoyé.</p>
            ) : params.rappel ? (
              <p style={{ margin: "8px 0 0", fontSize: 13, fontWeight: 700 }}>
                ✓ {int(sentNow || 0)} e-mail(s) envoyé(s){skippedNow ? ` · ${int(skippedNow)} ignoré(s) (déjà prévenu, plus programmé ou sans e-mail)` : ""}.
              </p>
            ) : null}
            {toRemind > 0 ? (
              <form action={sendKeepPremiumRemindersAction} style={{ marginTop: 10 }}>
                <button type="submit" className="btn btn-primary" style={{ fontSize: 13 }}>
                  Envoyer le message à {toRemind} abonné(s)
                </button>
              </form>
            ) : (
              <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--color-neutral-600)" }}>Tous ont déjà reçu le message.</p>
            )}
          </Card>
        </div>
      )}
      {departed.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Card title={`${departed.length} abonné(s) parti(s) ces ${WINBACK_WINDOW_DAYS} derniers jours : leur demander pourquoi, et s'ils reviennent`}>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
              Un e-mail signé Nathan : « ton alternance, tu en es où ? », le questionnaire, les nouveautés, et « tu veux réessayer le mois prochain ? ». Pas envoyé à ceux qui sont revenus, ont un accès à vie, ont dit avoir
              trouvé leur alternance, se sont désinscrits des e-mails ou viennent de recevoir le message de résiliation. Une seule fois par compte.
            </p>
            {params.retour === "erreur" ? (
              <p style={{ margin: "8px 0 0", fontSize: 13, color: "#b42318" }}>Lecture Stripe impossible, rien n&apos;a été envoyé.</p>
            ) : params.retour ? (
              <p style={{ margin: "8px 0 0", fontSize: 13, fontWeight: 700 }}>
                ✓ {int(winSent || 0)} e-mail(s) envoyé(s){winSkipped ? ` · ${int(winSkipped)} ignoré(s) (exclus ou déjà prévenus)` : ""}.
              </p>
            ) : null}
            {toWinBack > 0 ? (
              <form action={sendWinbackMessagesAction} style={{ marginTop: 10 }}>
                <button type="submit" className="btn btn-primary" style={{ fontSize: 13 }}>
                  Envoyer le message (jusqu&apos;à {toWinBack} personne(s))
                </button>
              </form>
            ) : (
              <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--color-neutral-600)" }}>Tous ont déjà reçu le message.</p>
            )}
          </Card>
        </div>
      )}

      <PeriodBar path="/admin/abonnements" period={period} computedAt={snap.computedAt} extraParams={{ mois: month.key }} />

      <Section title="Churn de la période" subtitle="Un client qui résilie mais garde son accès payé jusqu'à l'échéance n'est compté perdu qu'à la fin réelle de son abonnement. Un renouvellement refusé compte comme un départ dès le refus (s'il est payé ensuite, le client revient).">
        <KpiGrid>
          <Kpi
            label="Churn client"
            value={pct(chCur.rate)}
            delta={chCur.rate !== null && chPrev.rate !== null ? delta(Math.round(chCur.rate * 1000), Math.round(chPrev.rate * 1000), (n) => `${(n / 10).toLocaleString("fr-FR")} pt`) : null}
            goodWhen="down"
            sub={`${chCur.churned} perdu(s) sur ${chCur.startCount} abonné(s) au début`}
            definition="Abonnements en cours au premier jour de la période et terminés avant sa fin, divisés par les abonnements en cours au premier jour. Incalculable s'il n'y avait aucun abonné au début."
            source="Stripe"
          />
          <Kpi
            label="Churn de revenu"
            value={pct(chCur.revenueRate)}
            sub={`${euros(chCur.churnedMrr)} de MRR perdu sur ${euros(chCur.startMrr)}`}
            goodWhen="down"
            definition="MRR des abonnements perdus pendant la période, divisé par le MRR au premier jour. Stageio n'a pas de changement de formule à la baisse : seules les résiliations comptent."
            source="Stripe"
          />
          <Kpi
            label="Volontaire / impayé"
            value={`${chCur.voluntary} / ${chCur.involuntary}`}
            sub={chCur.unknown > 0 ? `${chCur.unknown} sans motif Stripe` : "Motif Stripe connu pour tous"}
            definition="Volontaire : résiliation demandée (portail, suppression de compte, admin). Impayé : renouvellement refusé (compté dès le refus, même si Stripe réessaie encore), ou litige."
            source="Stripe, cancellation_details.reason"
          />
          <Kpi
            label="Perdus après un paiement refusé"
            value={int(mvCur.lostAfterFailure)}
            delta={delta(mvCur.lostAfterFailure, mvPrev.lostAfterFailure)}
            goodWhen="down"
            sub={mvCur.failedOpen > 0 ? `${mvCur.failedOpen} paiement(s) refusé(s) encore récupérable(s)` : "aucun paiement refusé encore récupérable"}
            definition="Abonnements terminés pendant la période alors qu'un renouvellement venait d'être refusé (carte sans provision, expirée, 3D Secure). Stripe ne retente plus : ces factures restent ouvertes mais ne seront pas encaissées. Récupérables : refus sur un abonnement encore en cours, que Stripe retente."
            source="Stripe, factures et abonnements"
          />
          <Kpi
            label="Demandes de résiliation"
            value={int(mvCur.cancelRequests)}
            delta={delta(mvCur.cancelRequests, mvPrev.cancelRequests)}
            goodWhen="down"
            sub={`${state.scheduled.count} résiliation(s) programmée(s) en ce moment`}
            definition="Abonnements payants dont la résiliation a été demandée pendant la période, que l'accès se termine tout de suite ou à l'échéance."
            source="Stripe, canceled_at"
          />
          <Kpi
            label="Partis dans la période"
            value={int(chCur.startedAndEnded)}
            sub="Abonnés ET terminés pendant la période"
            definition="Abonnements commencés et terminés à l'intérieur de la période (souvent un remboursement ou une suppression de compte juste après l'achat). Hors taux de churn, qui ne suit que les abonnés du début."
            source="Stripe"
          />
        </KpiGrid>
        <div className="cockpit-grid-2" style={{ marginTop: 12 }}>
          <Card title="Motifs donnés dans le portail Stripe">
            {feedback.size === 0 ? (
              <p style={{ fontSize: 13, margin: 0, color: "var(--color-neutral-600)" }}>Aucune résiliation sur la période.</p>
            ) : (
              <table className="cockpit-table">
                <tbody>
                  {[...feedback.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .map(([k, n]) => (
                      <tr key={k}>
                        <td>{FEEDBACK_LABELS[k] ?? k}</td>
                        <td>{n}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
            <p style={{ fontSize: 11.5, color: "var(--color-neutral-500)", margin: "8px 0 0" }}>Motif facultatif : beaucoup de résiliations n&apos;en ont pas.</p>
          </Card>
          <Card title="Motifs du formulaire Stageio (avant le portail)">
            {reasons === null ? (
              <p style={{ fontSize: 13, margin: 0 }}>Lecture impossible.</p>
            ) : reasons.length === 0 ? (
              <p style={{ fontSize: 13, margin: 0, color: "var(--color-neutral-600)" }}>Aucune réponse sur la période.</p>
            ) : (
              <table className="cockpit-table">
                <tbody>
                  {reasons.map((r) => (
                    <tr key={r.reason}>
                      <td>{r.reason}</td>
                      <td>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p style={{ fontSize: 11.5, color: "var(--color-neutral-500)", margin: "8px 0 0" }}>
              <Link href="/admin/annulations">Voir les réponses détaillées</Link>
            </p>
          </Card>
        </div>
      </Section>

      <Section title="Renouvellements" subtitle="Échéances calculées depuis la date de facturation de chaque abonnement : un client inscrit en septembre ne renouvelle pas forcément en octobre.">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {months.map((m) => (
            <Link key={m} href={qs({ mois: m })} className={`cockpit-pill${m === month.key ? " is-good" : ""}`} style={{ textDecoration: "none" }}>
              {monthName(m)}
            </Link>
          ))}
        </div>
        <div className="cockpit-card cockpit-scroll">
          <table className="cockpit-table">
            <thead>
              <tr>
                <th>{monthName(month.key)}</th>
                <th>Échues</th>
                <th>Réussies</th>
                <th>Échouées</th>
                <th>Annulées avant</th>
                <th>Inconnues</th>
                <th>À venir</th>
                <th>Taux de renouvellement</th>
                <th>Taux d&apos;encaissement</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["1er renouvellement", summary.first],
                  ["Renouvellements suivants", summary.later],
                  ["Tous", summary.all],
                ] as const
              ).map(([label, r]) => (
                <tr key={label}>
                  <td>
                    <strong>{label}</strong>
                  </td>
                  <td>{r.due}</td>
                  <td>{r.ok}</td>
                  <td>{r.failed}</td>
                  <td>{r.canceled}</td>
                  <td>{r.unknown}</td>
                  <td>{r.upcoming}</td>
                  <td>{pct(r.rate)}</td>
                  <td>{pct(r.paymentRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: 11.5, color: "var(--color-neutral-500)", margin: "8px 0 0" }}>
            Taux de renouvellement = réussies / échues. Taux d&apos;encaissement = réussies / (réussies + échouées). « Inconnues » : échéance passée sans
            facture retrouvée à ± 3 jours.
          </p>
        </div>
        <details style={{ marginTop: 10 }}>
          <summary style={{ cursor: "pointer", fontSize: 13 }}>Voir les {renewals.length} échéance(s) du mois</summary>
          <div className="cockpit-card cockpit-scroll" style={{ marginTop: 8, padding: 0 }}>
            <table className="cockpit-table">
              <thead>
                <tr>
                  <th>Échéance</th>
                  <th>N°</th>
                  <th>Formule</th>
                  <th>Résultat</th>
                  <th>Client</th>
                  <th>Stripe</th>
                </tr>
              </thead>
              <tbody>
                {renewals.map((r) => (
                  <tr key={`${r.sub.id}-${r.k}`}>
                    <td>{date(r.due)}</td>
                    <td>{r.k === 1 ? "1er" : `${r.k}e`}</td>
                    <td>{planLabel(r.sub)}</td>
                    <td>
                      <span className={`cockpit-pill ${OUTCOME_TONE[r.outcome]}`}>{r.outcome}</span>
                    </td>
                    <td>{r.sub.userId ? <Link href={`/admin/users/${r.sub.userId}`}>{maskEmail(profiles.get(r.sub.userId)?.email ?? null)}</Link> : "—"}</td>
                    <td>
                      <a href={`https://dashboard.stripe.com/subscriptions/${r.sub.id}`} target="_blank" rel="noreferrer">
                        Ouvrir ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Section>

      <Section
        title={`Clients à surveiller (${alerts.length})`}
        subtitle={`Règles fixes : inactif depuis ${ALERT_RULES.inactiveDays} j, usage divisé par plus de 3 sur 14 j, aucune candidature après ${ALERT_RULES.noApplicationAfterDays} j de Premium, renouvellement échoué, résiliation programmée. Aucune n'invente un motif de départ.`}
      >
        <div className="cockpit-card cockpit-scroll" style={{ padding: 0, maxHeight: 420, overflowY: "auto" }}>
          <table className="cockpit-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Alerte</th>
                <th>Formule</th>
                <th>Depuis</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.sub.id}>
                  <td>{a.sub.userId ? <Link href={`/admin/users/${a.sub.userId}`}>{maskEmail(profiles.get(a.sub.userId)?.email ?? null)}</Link> : "—"}</td>
                  <td>
                    <span style={{ display: "inline-flex", gap: 4, flexWrap: "wrap" }}>
                      {a.items.map((it) => (
                        <span key={it.text} className={`cockpit-pill ${it.tone}`}>
                          {it.text}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td>{planLabel(a.sub)}</td>
                  <td>{date(firstPaid.get(a.sub.id) ?? a.sub.startDate)}</td>
                </tr>
              ))}
              {alerts.length === 0 && (
                <tr>
                  <td colSpan={4}>Aucune alerte.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title={`Abonnements (${tableRows.length})`}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          <Link href={qs({ statut: null })} className={`cockpit-pill${statusFilter ? "" : " is-good"}`} style={{ textDecoration: "none" }}>
            Tous les statuts
          </Link>
          {(Object.keys(STATUS_LABELS) as StatusKey[]).map((k) => (
            <Link key={k} href={qs({ statut: k })} className={`cockpit-pill${statusFilter === k ? " is-good" : ""}`} style={{ textDecoration: "none" }}>
              {STATUS_LABELS[k]} ({paid.filter((s) => statusOf(s, now) === k).length})
            </Link>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          <Link href={qs({ formule: null })} className={`cockpit-pill${planFilter ? "" : " is-good"}`} style={{ textDecoration: "none" }}>
            Toutes les formules
          </Link>
          {plans.map((pl) => (
            <Link key={pl} href={qs({ formule: pl })} className={`cockpit-pill${planFilter === pl ? " is-good" : ""}`} style={{ textDecoration: "none" }}>
              {pl}
            </Link>
          ))}
          <Link href={qs({ activite: inactiveOnly ? null : "inactif" })} className={`cockpit-pill${inactiveOnly ? " is-warn" : ""}`} style={{ textDecoration: "none" }}>
            Inactifs ≥ {ALERT_RULES.inactiveDays} j
          </Link>
        </div>
        <div className="cockpit-card cockpit-scroll" style={{ padding: 0, maxHeight: 560, overflowY: "auto" }}>
          <table className="cockpit-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Inscrit</th>
                <th>1er paiement</th>
                <th>Formule</th>
                <th>Prochaine échéance</th>
                <th>Renouv. payés</th>
                <th>Échecs</th>
                <th>Résiliation demandée</th>
                <th>Fin effective</th>
                <th>Dernière activité</th>
                <th>Likes</th>
                <th>Candidatures</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((s) => {
                const p = s.userId ? profiles.get(s.userId) : undefined;
                const u = s.userId ? usage.get(s.userId) : undefined;
                const st = statusOf(s, now);
                const c = cycleBySub.get(s.id) ?? { paid: 0, failed: 0 };
                return (
                  <tr key={s.id}>
                    <td>{s.userId ? <Link href={`/admin/users/${s.userId}`}>{maskEmail(p?.email ?? null)}</Link> : "—"}</td>
                    <td>{date(p ? Date.parse(p.created_at) : null)}</td>
                    <td>{date(firstPaid.get(s.id) ?? null)}</td>
                    <td>{planLabel(s)}</td>
                    <td>{st === "actif" || st === "impaye" ? date(s.currentPeriodEnd) : "—"}</td>
                    <td>{c.paid}</td>
                    <td>{c.failed}</td>
                    <td>{date(s.canceledAt)}</td>
                    <td>{date(endOf(s) ?? s.cancelAt)}</td>
                    <td>{date(lastActivity(s))}</td>
                    <td>{u?.likes ?? 0}</td>
                    <td>{u?.applications ?? 0}</td>
                    <td>
                      <span className={`cockpit-pill ${st === "actif" ? "is-good" : st === "impaye" ? "is-bad" : st === "programme" ? "is-warn" : ""}`}>{STATUS_LABELS[st]}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 11.5, color: "var(--color-neutral-500)", marginTop: 8 }}>
          Adresses masquées : ouvrir la fiche client pour le détail. Abonnements jamais payés (carte refusée à la création) exclus.
        </p>
      </Section>
    </div>
  );
}
