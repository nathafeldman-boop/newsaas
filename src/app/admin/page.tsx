import Link from "next/link";
import { Suspense } from "react";
import { Card, Insufficient, Kpi, KpiGrid, Section } from "@/components/admin/cockpit/Kpi";
import { PeriodBar } from "@/components/admin/cockpit/PeriodBar";
import { LineChart } from "@/components/admin/cockpit/LineChart";
import { BarChart } from "@/components/admin/cockpit/BarChart";
import { SERIES_COLORS } from "@/components/admin/cockpit/chartUtils";
import { activeSince, profilesByIds, signupsIn } from "@/lib/admin/cockpit/db";
import { delta, euros, int, parsePeriod, pct, periodRanges } from "@/lib/admin/cockpit/format";
import { loadSnapshot, nowMs } from "@/lib/admin/cockpit/load";
import {
  DAY_MS,
  churnIn,
  currentState,
  dailyRevenue,
  duplicateSubs,
  firstPaidBySub,
  mrrAt,
  mrrSeries,
  movementIn,
  paidSubs,
  revenueIn,
} from "@/lib/admin/cockpit/metrics";
import { requireAdminPage } from "@/lib/admin/accessCode";
import { TodayLive } from "@/components/admin/cockpit/TodayLive";
import { autoOfferBlockers } from "@/lib/admin/autoStatus";
import { TotalRevenueGauge } from "@/components/admin/goals/TotalRevenueGauge";
import { DEFAULT_GLOBAL_GOAL_CENTS, totalRevenue } from "@/lib/admin/history";
import { loadSavedGoals } from "@/lib/admin/goalsData";
import { monthRange } from "@/lib/admin/cockpit/format";
import { monthLabel } from "@/lib/admin/goals";

// Vue d'ensemble du cockpit : « comment se porte Stageio aujourd'hui ? ».
// Chiffres de paiement lus dans Stripe (instantané de 30 min max), comptes
// et activité dans Supabase. Chaque tuile a sa définition et sa source.
export const maxDuration = 60;

export default async function CockpitOverviewPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  await requireAdminPage();
  const { p } = await searchParams;
  const period = parsePeriod(p);
  const now = nowMs();
  const { current, previous } = periodRanges(period, now);
  const { snap, error } = await loadSnapshot();

  const [signupsCur, signupsPrev, active7, active30, autoBlockers, savedGoals] = await Promise.all([
    signupsIn(current).catch(() => null),
    signupsIn(previous).catch(() => null),
    activeSince(now - 7 * DAY_MS).catch(() => null),
    activeSince(now - 30 * DAY_MS).catch(() => null),
    autoOfferBlockers().catch(() => [] as string[]),
    loadSavedGoals().catch(() => null),
  ]);
  const autoAlert =
    autoBlockers.length > 0
      ? { tone: "is-bad", text: `Stageio Auto n'est pas proposée : ${autoBlockers.join(" ; ")}`, href: "/admin/sante" }
      : null;

  if (!snap) {
    return (
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 12px" }}>Vue d&apos;ensemble</h1>
        <Suspense fallback={null}>
          <TodayLive now={now} />
        </Suspense>
        {autoAlert && (
          <p className="cockpit-pill is-bad" style={{ fontSize: 13, padding: "6px 12px", borderRadius: 10, margin: "16px 0 0", display: "inline-block" }}>
            <span aria-hidden>⛔</span> {autoAlert.text}
          </p>
        )}
        <div style={{ marginTop: 16 }} />
        <Card>
          <p style={{ margin: 0, fontSize: 14 }}>
            Lecture Stripe impossible pour l&apos;instant ({error}). Les chiffres de paiement ne sont pas affichés plutôt que d&apos;être faux.
          </p>
        </Card>
      </div>
    );
  }

  const firstPaid = firstPaidBySub(snap.invoices);
  const paid = paidSubs(snap, firstPaid);
  const state = currentState(paid, now);
  const mrrSeriesNow = mrrAt(paid, now);
  const mrr7 = mrrAt(paid, now - 7 * DAY_MS);
  const mrr30 = mrrAt(paid, now - 30 * DAY_MS);
  const revCur = revenueIn(snap, current);
  const revPrev = revenueIn(snap, previous);
  const mvCur = movementIn(snap, current, firstPaid);
  const mvPrev = movementIn(snap, previous, firstPaid);
  const chCur = churnIn(paid, current);
  const chPrev = churnIn(paid, previous);
  const series = mrrSeries(paid, current);
  const daily = dailyRevenue(snap, current);

  // Conversion : inscrits de la période qui ont payé (abonnement ou accès à vie), à n'importe quelle date depuis.
  const payerIds = new Set<string>([
    ...paid.map((s) => s.userId).filter((id): id is string => !!id),
    ...snap.oneTime.map((o) => o.userId),
  ]);
  const conv = (ids: string[] | null) => (ids && ids.length > 0 ? ids.filter((id) => payerIds.has(id)).length / ids.length : null);
  const convCur = conv(signupsCur);
  const convPrev = conv(signupsPrev);

  // Alertes (règles fixes, détaillées sur « Abonnements et churn » et « Santé et données »).
  const payerProfiles = await profilesByIds([...payerIds]).catch(() => null);
  const missingCredit = payerProfiles ? [...payerIds].filter((id) => (payerProfiles.get(id)?.total_paid_cents ?? 0) <= 0).length : null;
  const duplicates = duplicateSubs(paid, now).length;
  const cancels7 = movementIn(snap, { start: now - 7 * DAY_MS, end: now }, firstPaid).cancelRequests;
  const cancelsPrev7 = movementIn(snap, { start: now - 14 * DAY_MS, end: now - 7 * DAY_MS }, firstPaid).cancelRequests;
  const alerts = [
    autoAlert,
    state.pastDue.count > 0 && { tone: "is-bad", text: `${state.pastDue.count} abonnement(s) en impayé (${euros(state.pastDue.mrr)} de MRR)`, href: "/admin/abonnements?statut=impaye" },
    mvCur.failedOpen > 0 && { tone: "is-bad", text: `${mvCur.failedOpen} paiement(s) refusé(s) encore récupérable(s) (abonnement en cours)`, href: "/admin/abonnements?statut=impaye" },
    state.scheduled.count > 0 && { tone: "is-warn", text: `${state.scheduled.count} résiliation(s) programmée(s) (${euros(state.scheduled.mrr)} de MRR à risque)`, href: "/admin/abonnements?statut=programme" },
    cancels7 >= 3 && cancels7 >= 2 * Math.max(1, cancelsPrev7) && { tone: "is-bad", text: `Hausse des résiliations : ${cancels7} demandes en 7 jours contre ${cancelsPrev7} les 7 jours d'avant`, href: "/admin/abonnements" },
    missingCredit && { tone: "is-warn", text: `${missingCredit} payeur(s) Stripe sans paiement noté en base`, href: "/admin/sante" },
    duplicates > 0 && { tone: "is-warn", text: `${duplicates} client(s) avec deux abonnements en cours`, href: "/admin/sante" },
    revCur.disputes > 0 && { tone: "is-bad", text: `${revCur.disputes} litige(s) bancaire(s) sur la période`, href: "/admin/sante" },
  ].filter((a): a is { tone: string; text: string; href: string } => !!a);

  const signed = (cents: number) => `${cents >= 0 ? "+" : "−"}${euros(Math.abs(cents))}`;

  // Revenu total de Stageio face à l'objectif global (28/10).
  const total = totalRevenue(snap, now);
  const thisMonth = monthRange(undefined, now);
  const globalGoal = savedGoals?.globalCents ?? null;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <TotalRevenueGauge
          totalCents={total.netCents}
          goalCents={globalGoal ?? DEFAULT_GLOBAL_GOAL_CENTS}
          goalIsDefault={globalGoal === null}
          monthCents={revenueIn(snap, thisMonth.range).netCents}
          monthName={monthLabel(thisMonth.key).replace(/^./, (c) => c.toUpperCase())}
          refundedCents={total.refundedCents}
        />
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Vue d&apos;ensemble</h1>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--color-neutral-600)" }}>
        Comment se porte Stageio : {period} derniers jours, comparés aux {period} jours d&apos;avant.
      </p>
      <Suspense fallback={null}>
        <TodayLive now={now} />
      </Suspense>
      <div style={{ marginTop: 28 }}>
        <PeriodBar path="/admin" period={period} computedAt={snap.computedAt} />
      </div>

      {alerts.length > 0 && (
        <Section title="À regarder">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {alerts.map((a) => (
              <Link key={a.text} href={a.href} className={`cockpit-pill ${a.tone}`} style={{ fontSize: 13, padding: "6px 12px", borderRadius: 10, textDecoration: "none", alignSelf: "flex-start" }}>
                <span aria-hidden>{a.tone === "is-bad" ? "⛔" : "⚠️"}</span> {a.text}
              </Link>
            ))}
          </div>
        </Section>
      )}

      <Section title="Revenus">
        <KpiGrid>
          <Kpi
            hero
            accent="green"
            href="/admin/revenus"
            label="MRR actuel"
            value={euros(state.mrr)}
            sub={
              <>
                {state.active} abonnement{state.active > 1 ? "s" : ""} payant{state.active > 1 ? "s" : ""} · 7 j : {signed(mrrSeriesNow - mrr7)} · 30 j : {signed(mrrSeriesNow - mrr30)}
              </>
            }
            definition="Revenu récurrent mensuel des abonnements en cours et à jour de paiement, ramené au mois (hebdo × 52 / 12). Exclut les impayés, les pauses et l'accès à vie (paiement unique). Les variations comparent les abonnements en cours à chaque date, impayés compris (l'historique des impayés n'est pas reconstituable)."
            source="Stripe, abonnements"
          />
          <Kpi
            accent="green"
            href={`/admin/revenus?p=${period}`}
            label="Encaissé sur la période"
            value={euros(revCur.recurringCents + revCur.oneTimeCents)}
            delta={delta(revCur.recurringCents + revCur.oneTimeCents, revPrev.recurringCents + revPrev.oneTimeCents, (n) => euros(n))}
            sub={`Abonnements ${euros(revCur.recurringCents)} · à vie ${euros(revCur.oneTimeCents)}`}
            definition="Paiements réussis pendant la période : factures d'abonnement payées et achats à vie. Brut, avant remboursements et frais Stripe."
            source="Stripe, factures et sessions de paiement"
          />
          <Kpi
            accent="amber"
            href={`/admin/revenus?p=${period}`}
            label="Remboursé"
            value={euros(revCur.refundedCents)}
            delta={delta(revCur.refundedCents, revPrev.refundedCents, (n) => euros(n))}
            goodWhen="down"
            sub={`${revCur.refunds} remboursement${revCur.refunds > 1 ? "s" : ""} · net ${euros(revCur.netCents)}`}
            definition="Remboursements réussis pendant la période, quelle que soit la date du paiement d'origine. Net = encaissé − remboursé (frais Stripe non déduits)."
            source="Stripe, remboursements"
          />
        </KpiGrid>
      </Section>

      <Section title="Abonnements">
        <KpiGrid>
          <Kpi
            accent="blue"
            href={`/admin/abonnements?p=${period}`}
            label="Nouveaux abonnements"
            value={int(mvCur.newSubs)}
            delta={delta(mvCur.newSubs, mvPrev.newSubs)}
            sub={`+ ${mvCur.lifetimeBuyers} accès à vie`}
            definition="Abonnements dont le premier paiement a eu lieu pendant la période. L'accès à vie est compté à part."
            source="Stripe"
          />
          <Kpi
            accent="blue"
            href={`/admin/abonnements?p=${period}`}
            label="Renouvellements réussis"
            value={int(mvCur.renewals)}
            delta={delta(mvCur.renewals, mvPrev.renewals)}
            sub={euros(mvCur.renewalCents)}
            definition="Factures de renouvellement (2e paiement et suivants) payées pendant la période."
            source="Stripe, factures subscription_cycle"
          />
          <Kpi
            accent="pink"
            href="/admin/annulations"
            cta="Voir pourquoi"
            label="Clients perdus"
            value={int(chCur.churned)}
            delta={delta(chCur.churned, chPrev.churned)}
            goodWhen="down"
            sub={`Churn ${pct(chCur.rate)} · ${chCur.voluntary} volontaire${chCur.voluntary > 1 ? "s" : ""}, ${chCur.involuntary} impayé${chCur.involuntary > 1 ? "s" : ""}`}
            definition="Abonnements en cours au début de la période et terminés pendant celle-ci. Une résiliation programmée ne compte qu'à la fin réelle de l'accès payé. Taux = perdus / abonnés au début de la période."
            source="Stripe, fin réelle des abonnements"
          />
          <Kpi
            accent="pink"
            href="/admin/abonnements?statut=impaye"
            label="Paiements échoués"
            value={int(mvCur.failedOpen)}
            delta={delta(mvCur.failedOpen, mvPrev.failedOpen)}
            goodWhen="down"
            sub={`${mvCur.recoveredAfterFailure} récupéré${mvCur.recoveredAfterFailure > 1 ? "s" : ""} après un échec`}
            definition="Factures d'abonnement émises pendant la période, tentées et toujours impayées. « Récupérés » : payées après au moins un échec."
            source="Stripe, factures"
          />
        </KpiGrid>
      </Section>

      <Section title="Utilisateurs">
        <KpiGrid>
          <Kpi
            accent="violet"
            href="/admin/inscriptions"
            cta="Jour par jour"
            label="Nouveaux inscrits"
            value={signupsCur ? int(signupsCur.length) : <Insufficient />}
            delta={signupsCur && signupsPrev ? delta(signupsCur.length, signupsPrev.length) : null}
            definition="Comptes créés pendant la période."
            source="Supabase, profils"
          />
          <Kpi
            accent="violet"
            href="/admin/cohortes"
            label="Inscription → payant"
            value={convCur === null ? <Insufficient /> : pct(convCur)}
            delta={convCur !== null && convPrev !== null ? delta(Math.round(convCur * 1000), Math.round(convPrev * 1000), (n) => `${(n / 10).toLocaleString("fr-FR")} pt`) : null}
            definition="Part des inscrits de la période qui ont payé au moins une fois (abonnement ou accès à vie), à ce jour. La période récente est sous-estimée : ses inscrits ont eu moins de temps pour payer."
            source="Supabase (inscrits) + Stripe (payeurs)"
          />
          <Kpi
            accent="green"
            href="/admin/users"
            cta="Voir les comptes"
            label="Actifs 7 jours"
            value={active7 === null ? <Insufficient /> : int(active7)}
            sub={active30 === null ? undefined : `${int(active30)} sur 30 jours`}
            definition="Comptes dont la dernière activité dans l'appli date de moins de 7 jours (30 jours en dessous). Seule la dernière activité est enregistrée : l'évolution passée n'est pas disponible."
            source="Supabase, profils.last_active_at"
          />
        </KpiGrid>
      </Section>

      <Section title="Évolution" subtitle="MRR des abonnements en cours chaque jour (impayés compris) et encaissements quotidiens.">
        <div className="cockpit-grid-2">
          <Card title="MRR">
            <LineChart times={series.map((x) => x.t)} series={[{ name: "MRR", color: SERIES_COLORS[0], values: series.map((x) => x.mrr) }]} unit="eur" caption="MRR quotidien" />
          </Card>
          <Card title="Encaissements par jour">
            <BarChart
              times={daily.map((x) => x.t)}
              series={[
                { name: "Abonnements", color: SERIES_COLORS[0], values: daily.map((x) => x.recurring) },
                { name: "Accès à vie", color: SERIES_COLORS[1], values: daily.map((x) => x.oneTime) },
              ]}
              unit="eur"
              caption="Encaissements quotidiens par type"
            />
          </Card>
        </div>
      </Section>

      <p style={{ marginTop: 24, fontSize: 12, color: "var(--color-neutral-500)" }}>
        Détail : <Link href={`/admin/revenus?p=${period}`}>revenus</Link> · <Link href={`/admin/abonnements?p=${period}`}>abonnements et churn</Link> ·{" "}
        <Link href="/admin/cohortes">cohortes</Link> · <Link href="/admin/sante">santé et définitions</Link>
      </p>
    </div>
  );
}
