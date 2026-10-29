import Link from "next/link";
import { Card, Kpi, KpiGrid, Section } from "@/components/admin/cockpit/Kpi";
import { BarChart } from "@/components/admin/cockpit/BarChart";
import { SERIES_COLORS } from "@/components/admin/cockpit/chartUtils";
import { GoalChart } from "@/components/admin/goals/GoalChart";
import { GoalHero } from "@/components/admin/goals/GoalHero";
import { requireAdminPage } from "@/lib/admin/accessCode";
import { euros, int, monthRange, pct, shortDay } from "@/lib/admin/cockpit/format";
import { loadSnapshot, nowMs } from "@/lib/admin/cockpit/load";
import { revenueIn } from "@/lib/admin/cockpit/metrics";
import { DEFAULT_GOALS, MIN_CHANNEL_SIGNUPS, expectedRenewals, goalFor, monthLabel, monthProgress, planFor, shiftMonth } from "@/lib/admin/goals";
import { GOALS_TABLE_SQL, getMeasuredRates, loadSavedGoals, monthDays, type MeasuredRates } from "@/lib/admin/goalsData";
import { DEFAULT_GLOBAL_GOAL_CENTS, totalRevenue } from "@/lib/admin/history";
import { TotalRevenueGauge } from "@/components/admin/goals/TotalRevenueGauge";
import { YearChallenge } from "@/components/admin/goals/YearChallenge";
import { challengeState } from "@/lib/admin/challenge";
import { saveGlobalGoalAction, saveGoalAction } from "@/app/admin/objectifs/actions";

// Objectifs (26/10, demande de Nathan) : « octobre, finir à 1 300 € ;
// novembre 3 000 € ; décembre 5 000 € ; à chaque fois une estimation de
// combien il nous faudrait d'utilisateurs, avec le taux de conversion, le
// nombre de vues… ce qu'on a fait jour par jour, avec une belle analyse ;
// ensuite on pourra définir nous-mêmes nos objectifs ».
// Encaissé = net Stripe (abonnements + accès à vie − remboursements, frais
// Stripe non déduits), comme « Net encaissé » sur Revenus et MRR.
export const maxDuration = 60;

const ERRORS: Record<string, string> = {
  invalid: "Saisie invalide : choisis un mois et un montant en euros.",
  save: "Enregistrement impossible, réessaie.",
  missing_table: "La table des objectifs n'existe pas encore : colle le SQL ci-dessous dans Supabase.",
};

const muted = "var(--color-neutral-600)";
const perDay = (n: number | null, days: number) => (n === null || days <= 0 ? null : Math.ceil(n / days));
const fmtCount = (n: number | null) => (n === null ? "—" : int(n));

function Funnel({ steps }: { steps: { label: string; value: number | null; hint: string }[] }) {
  const top = Math.max(...steps.map((s) => s.value ?? 0), 1);
  return (
    <div className="goal-funnel">
      {steps.map((s, i) => (
        <div key={s.label} className="goal-funnel-row">
          <span style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</span>
          <span style={{ fontSize: 15, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{fmtCount(s.value)}</span>
          <div className="goal-funnel-bar">
            <i style={{ width: `${s.value === null ? 0 : Math.max(2, (s.value / top) * 100)}%`, animationDelay: `${i * 90}ms` }} />
          </div>
          <span style={{ gridColumn: "1 / -1", fontSize: 11.5, color: muted }}>{s.hint}</span>
        </div>
      ))}
    </div>
  );
}

function RatesNote({ rates }: { rates: MeasuredRates }) {
  return (
    <p style={{ fontSize: 12, color: muted, margin: "10px 0 0", lineHeight: 1.5 }}>
      Taux mesurés sur les {rates.windowDays} derniers jours : {int(rates.signups)} inscrits, dont {int(rates.payers)} ont payé (
      {pct(rates.conversion)}) · premier paiement moyen {rates.avgFirstPaymentCents ? euros(rates.avgFirstPaymentCents) : "—"} sur{" "}
      {int(rates.firstPayments)} paiements · paywall vu par {pct(rates.paywallRate)} des inscrits, paiement ouvert par {pct(rates.checkoutRate)}
      {rates.views ? ` · ${(rates.signupsPer1000Views ?? 0).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} inscrits pour 1 000 vues (vues saisies le ${rates.views.date})` : " · vues : aucune saisie dans RPM, nombre de vues non estimé"}.
    </p>
  );
}

export default async function ObjectifsPage({ searchParams }: { searchParams: Promise<{ m?: string; error?: string; saved?: string }> }) {
  await requireAdminPage();
  const { m, error, saved } = await searchParams;
  const now = nowMs();
  const current = monthRange(undefined, now).key;
  const { key, range } = monthRange(m, now);
  const [{ snap, error: stripeError }, savedGoals, rates] = await Promise.all([loadSnapshot(), loadSavedGoals(), getMeasuredRates().catch(() => null)]);
  if (!snap) {
    return (
      <Card>
        <p style={{ margin: 0 }}>Lecture Stripe impossible pour l&apos;instant ({stripeError}).</p>
      </Card>
    );
  }

  // Revenu total et défi d'un an (déplacés ici depuis la vue d'ensemble, 30/10).
  const total = totalRevenue(snap, now);
  const thisMonth = monthRange(undefined, now);
  const challenge = challengeState({ now, totalCents: total.netCents, last30Cents: revenueIn(snap, { start: now - 30 * 86_400_000, end: now }).netCents });

  const goals = { ...DEFAULT_GOALS, ...savedGoals.goals };
  const goal = goalFor(key, savedGoals.goals);
  const status: "past" | "current" | "future" = range.end <= now ? "past" : range.start > now ? "future" : "current";
  const days = await monthDays(snap, range, now);
  const progress = monthProgress(
    days.map((d) => ({ t: d.t, cents: d.cents })),
    goal ?? 0,
    now,
    status === "current",
  );
  const renewals = status === "past" ? null : expectedRenewals(snap, { start: Math.max(now, range.start), end: range.end }, now);
  const remaining = Math.max(0, (goal ?? 0) - progress.totalCents);
  const plan = rates && goal !== null ? planFor(remaining, renewals?.cents ?? 0, rates) : null;
  const daysToGo = status === "future" ? progress.daysInMonth : progress.daysToGo;
  const signupsPerDayNow = rates ? rates.signups / rates.windowDays : null;
  const neededSignupsPerDay = plan ? perDay(plan.signups, daysToGo) : null;
  const revenuePerSignup = rates?.conversion && rates.avgFirstPaymentCents ? rates.conversion * rates.avgFirstPaymentCents : null;

  // Onglets : octobre à décembre, les mois enregistrés et le mois en cours.
  const tabMonths = [...new Set([...Object.keys(goals), current, key])].sort();
  const tabs = tabMonths.map((month) => {
    const r = monthRange(month, now).range;
    const g = goals[month] ?? null;
    const done = r.start <= now ? revenueIn(snap, r).netCents : 0;
    return { month, goal: g, ratio: g ? done / g : 0 };
  });

  // Analyse : phrases calculées, jamais écrites à la main.
  const insights: { icon: string; text: string }[] = [];
  if (goal !== null && status === "current") {
    const expected = Math.round(goal * progress.expectedRatio);
    const gap = progress.totalCents - expected;
    insights.push({
      icon: gap >= 0 ? "🚀" : "⏱️",
      text:
        gap >= 0
          ? `En avance : ${euros(progress.totalCents)} encaissés, ${euros(gap)} de plus que le rythme régulier (${euros(expected)} attendus à ce jour).`
          : `En retard de ${euros(-gap)} sur le rythme régulier : ${euros(progress.totalCents)} encaissés pour ${euros(expected)} attendus à ce jour.`,
    });
    insights.push({
      icon: progress.projectionCents >= goal ? "🎯" : "📉",
      text: `Si les ${progress.daysToGo} jours restants ressemblent aux 7 derniers (${euros(progress.avgLast7)} par jour), le mois finit vers ${euros(progress.projectionCents)}, soit ${Math.round((progress.projectionCents / goal) * 100)} % de l'objectif${progress.projectionCents >= goal ? " : objectif atteint." : `. Il manquerait ${euros(goal - progress.projectionCents)}.`}`,
    });
    if (remaining > 0) {
      insights.push({
        icon: "📌",
        text: `Pour finir à ${euros(goal)} : ${euros(progress.neededPerDay)} par jour d'ici la fin du mois${plan?.payers ? `, soit environ ${int(perDay(plan.payers, daysToGo) ?? 0)} nouveau(x) payant(s) par jour` : ""}${neededSignupsPerDay ? ` et ${int(neededSignupsPerDay)} inscrits par jour au taux actuel` : ""}.`,
      });
    }
  }
  if (goal !== null && status === "future" && plan) {
    insights.push({
      icon: "🧭",
      text: `Pour ${euros(goal)} en ${monthLabel(key)} : environ ${euros(renewals?.cents ?? 0)} viendront des renouvellements des abonnés actuels ; il reste ${euros(plan.newRevenueCents)} à aller chercher auprès de nouveaux payants${plan.payers ? ` (≈ ${int(plan.payers)})` : ""}.`,
    });
  }
  if (neededSignupsPerDay && signupsPerDayNow) {
    const factor = neededSignupsPerDay / signupsPerDayNow;
    insights.push({
      icon: factor <= 1 ? "✅" : "📣",
      text:
        factor <= 1
          ? `Le rythme d'inscription actuel (${Math.round(signupsPerDayNow)} par jour) suffit si la conversion tient.`
          : `Il faut ${int(neededSignupsPerDay)} inscrits par jour, ×${factor.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} le rythme des 30 derniers jours (${Math.round(signupsPerDayNow)} par jour). Autre levier : la conversion (${pct(rates?.conversion ?? null)} aujourd'hui) ; à +1 point, il en faudrait ${int(Math.ceil(((plan?.payers ?? 0) / ((rates?.conversion ?? 0) + 0.01)) / Math.max(1, daysToGo)))} par jour.`,
    });
  }
  if (progress.best && status !== "future") {
    insights.push({ icon: "🏆", text: `Meilleur jour du mois : ${shortDay(progress.best.t)}, ${euros(progress.best.cents)} encaissés.` });
  }
  if (renewals && renewals.cents > 0 && status !== "past") {
    insights.push({
      icon: "🔁",
      text: `Renouvellements attendus ${status === "current" ? "d'ici la fin du mois" : "sur le mois"} : ${euros(renewals.cents)} (environ ${Math.round(renewals.count)} échéances, pondérées par les taux de renouvellement mesurés : ${pct(renewals.firstRate)} au 1er, ${pct(renewals.laterRate)} ensuite).`,
    });
  }
  const channels = (rates?.channels ?? []).filter((c) => c.signups > 0);
  const strongest = channels.filter((c) => c.signups >= MIN_CHANNEL_SIGNUPS).sort((a, b) => b.cents / b.signups - a.cents / a.signups)[0];
  if (strongest) {
    insights.push({
      icon: "💡",
      text: `Canal le plus rentable (30 jours, ${int(strongest.signups)} inscrits ou plus) : ${strongest.channel}, ${euros(Math.round(strongest.cents / strongest.signups))} encaissés par inscrit.`,
    });
  }

  const elapsedDays = days.filter((d) => d.t <= now);
  const nextFree = (() => {
    let mth = shiftMonth(current, 1);
    while (goals[mth] !== undefined) mth = shiftMonth(mth, 1);
    return mth;
  })();

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Objectifs</h1>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: muted }}>
        Ce qu&apos;on veut encaisser chaque mois, où on en est, et ce qu&apos;il faut (payants, inscrits, vues) pour y arriver. Montants nets Stripe,
        remboursements déduits.
      </p>

      <div style={{ marginBottom: 20 }}>
        <TotalRevenueGauge
          totalCents={total.netCents}
          goalCents={savedGoals.globalCents ?? DEFAULT_GLOBAL_GOAL_CENTS}
          goalIsDefault={savedGoals.globalCents === null}
          monthCents={revenueIn(snap, thisMonth.range).netCents}
          monthName={monthLabel(thisMonth.key).replace(/^./, (c) => c.toUpperCase())}
          refundedCents={total.refundedCents}
        />
        <div style={{ marginTop: 12 }}>
          <YearChallenge now={now} state={challenge} />
        </div>
      </div>

      {error && <p className="cockpit-pill is-bad" style={{ marginBottom: 12 }}>{ERRORS[error] ?? "Une erreur est survenue."}</p>}
      {saved && <p className="cockpit-pill is-good" style={{ marginBottom: 12 }}>Objectif enregistré.</p>}

      <nav className="goal-tabs" aria-label="Mois">
        {tabs.map((t) => (
          <Link key={t.month} href={`/admin/objectifs?m=${t.month}`} className={`goal-tab${t.month === key ? " is-active" : ""}`} aria-current={t.month === key ? "page" : undefined}>
            <b>{monthLabel(t.month)}</b>
            <small>{t.goal ? `Objectif ${euros(t.goal)}` : "Pas d'objectif"}</small>
            {t.goal ? (
              <span className="goal-tab-bar" aria-hidden>
                <i style={{ width: `${Math.min(100, t.ratio * 100)}%` }} />
              </span>
            ) : null}
          </Link>
        ))}
      </nav>

      {goal === null ? (
        <Card>
          <p style={{ margin: 0, fontSize: 14 }}>Pas encore d&apos;objectif pour {monthLabel(key)}. Fixe-le en bas de la page.</p>
        </Card>
      ) : (
        <>
          <div style={{ marginTop: 16 }}>
            <GoalHero
              title={`Objectif de ${monthLabel(key)}`}
              achievedCents={progress.totalCents}
              goalCents={goal}
              expectedRatio={progress.expectedRatio}
              projectionCents={status === "current" ? progress.projectionCents : null}
              status={status}
              note={
                status === "future"
                  ? `Commence le ${shortDay(range.start)}.`
                  : status === "past"
                    ? "Mois terminé."
                    : `${progress.daysToGo} jour(s) restant(s), aujourd'hui compris.`
              }
            />
          </div>

          <Section title="En chiffres">
            <KpiGrid>
              <Kpi label="Encaissé" value={euros(progress.totalCents)} accent="green" definition="Net encaissé du mois : abonnements + accès à vie − remboursements. Frais Stripe non déduits." source="Stripe" />
              <Kpi label="Reste à faire" value={euros(remaining)} accent="amber" definition="Objectif du mois − encaissé." source="Objectif et Stripe" />
              {status !== "past" && (
                <Kpi
                  label="Il faut par jour"
                  value={euros(status === "future" ? Math.ceil(goal / progress.daysInMonth) : progress.neededPerDay)}
                  sub={`sur ${daysToGo} jour(s)`}
                  accent="violet"
                  definition="Reste à faire ÷ jours à venir (aujourd'hui compris)."
                  source="Calcul"
                />
              )}
              {status !== "future" && (
                <Kpi label="Moyenne 7 derniers jours" value={euros(progress.avgLast7)} sub="par jour terminé" accent="blue" definition="Encaissé net moyen des 7 derniers jours terminés du mois." source="Stripe" />
              )}
              {status === "current" && (
                <Kpi
                  label="Projection fin de mois"
                  value={euros(progress.projectionCents)}
                  sub={`${Math.round((progress.projectionCents / goal) * 100)} % de l'objectif`}
                  accent="pink"
                  definition="Encaissé + (jours restants × moyenne des 7 derniers jours terminés). Aujourd'hui : ce qui est déjà encaissé, ou la moyenne si elle est plus haute."
                  source="Calcul sur Stripe"
                />
              )}
              {renewals && (
                <Kpi
                  label="Renouvellements attendus"
                  value={euros(renewals.cents)}
                  sub={status === "current" ? "d'ici la fin du mois" : "sur le mois"}
                  accent="green"
                  definition="Échéances à venir des abonnés actuels, chacune pondérée par le taux de renouvellement mesuré sur 60 jours (1er renouvellement à part). Résiliations programmées exclues ; abonnés gagnés d'ici là non comptés."
                  source="Stripe, abonnements et factures"
                />
              )}
            </KpiGrid>
          </Section>

          <Section title="La courbe du mois" subtitle="Cumul encaissé jour après jour, comparé au rythme régulier qui mène à l'objectif.">
            <Card>
              <GoalChart
                times={days.map((d) => d.t)}
                daily={elapsedDays.map((d) => d.cents)}
                cumulative={progress.cumulative}
                goalCents={goal}
                projectionCents={status === "current" ? progress.projectionCents : null}
              />
            </Card>
          </Section>

          {status !== "past" && (
            <Section
              title="Ce qu'il faut pour y arriver"
              subtitle={`Sur ${daysToGo} jour(s) : après les renouvellements attendus, combien de nouveaux payants, d'inscrits et de vues il faut, aux taux mesurés.`}
            >
              {!rates || !plan ? (
                <Card>
                  <p style={{ margin: 0, fontSize: 13 }}>Taux indisponibles pour l&apos;instant (base lente) : recharge dans quelques minutes.</p>
                </Card>
              ) : (
                <div className="cockpit-grid-2">
                  <Card title="Sur le reste du mois">
                    <Funnel
                      steps={[
                        { label: "Vues", value: plan.views, hint: rates.signupsPer1000Views ? `${rates.signupsPer1000Views.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} inscrits pour 1 000 vues` : "Saisis tes vues dans RPM pour l'estimer" },
                        { label: "Inscrits", value: plan.signups, hint: `${pct(rates.conversion)} des inscrits paient` },
                        { label: "Voient le paywall", value: plan.paywallViews, hint: `${pct(rates.paywallRate)} des inscrits` },
                        { label: "Ouvrent le paiement", value: plan.checkouts, hint: `${pct(rates.checkoutRate)} des inscrits` },
                        { label: "Nouveaux payants", value: plan.payers, hint: `premier paiement moyen ${rates.avgFirstPaymentCents ? euros(rates.avgFirstPaymentCents) : "—"}` },
                      ]}
                    />
                    <p style={{ fontSize: 12.5, margin: "12px 0 0" }}>
                      Nouveau chiffre à faire : <b>{euros(plan.newRevenueCents)}</b> ({euros(remaining)} restants − {euros(renewals?.cents ?? 0)} de renouvellements attendus).
                    </p>
                  </Card>
                  <Card title="Par jour">
                    <KpiGrid>
                      <Kpi label="Inscrits par jour" value={fmtCount(neededSignupsPerDay)} sub={signupsPerDayNow ? `aujourd'hui : ${Math.round(signupsPerDayNow)} par jour (30 j)` : undefined} definition="Inscrits nécessaires ÷ jours à venir." source="Calcul sur les taux mesurés" />
                      <Kpi label="Nouveaux payants par jour" value={fmtCount(perDay(plan.payers, daysToGo))} definition="Nouveaux payants nécessaires ÷ jours à venir." source="Calcul" />
                      <Kpi label="Vues par jour" value={fmtCount(perDay(plan.views, daysToGo))} definition="Vues nécessaires ÷ jours à venir, d'après les inscrits pour 1 000 vues de la dernière saisie RPM." source="RPM (saisie) et profils" />
                      <Kpi label="Revenu par inscrit" value={revenuePerSignup ? euros(Math.round(revenuePerSignup)) : "—"} definition="Conversion × premier paiement moyen, sur 30 jours." source="Stripe et profils" />
                    </KpiGrid>
                    <RatesNote rates={rates} />
                  </Card>
                </div>
              )}
            </Section>
          )}

          {status !== "past" && plan && plan.newRevenueCents > 0 && channels.length > 0 && (
            <Section title="Selon le canal" subtitle="Si tous les nouveaux inscrits venaient d'un seul canal (réponses à « Tu nous as connus comment ? », 30 derniers jours).">
              <div className="cockpit-card cockpit-scroll" style={{ padding: 0 }}>
                <table className="cockpit-table">
                  <thead>
                    <tr>
                      <th>Canal</th>
                      <th>Inscrits (30 j)</th>
                      <th>Payants</th>
                      <th>Conversion</th>
                      <th>Encaissé par inscrit</th>
                      <th>Inscrits nécessaires</th>
                      <th>Par jour</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channels.map((c) => {
                      const perSignup = c.signups > 0 ? c.cents / c.signups : 0;
                      const fragile = c.signups < MIN_CHANNEL_SIGNUPS || c.payers === 0;
                      const needed = perSignup > 0 ? Math.ceil(plan.newRevenueCents / perSignup) : null;
                      return (
                        <tr key={c.channel}>
                          <td style={{ fontWeight: 700 }}>
                            {c.channel} {fragile && <span className="cockpit-pill is-warn">peu de données</span>}
                          </td>
                          <td>{int(c.signups)}</td>
                          <td>{int(c.payers)}</td>
                          <td>{pct(c.signups > 0 ? c.payers / c.signups : null)}</td>
                          <td>{perSignup > 0 ? euros(Math.round(perSignup)) : "—"}</td>
                          <td>{needed === null ? "—" : int(needed)}</td>
                          <td>{needed === null ? "—" : int(Math.ceil(needed / Math.max(1, daysToGo)))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p style={{ fontSize: 12, color: muted, margin: "8px 0 0" }}>
                Encaissé par inscrit : tout ce qu&apos;ont payé les inscrits du canal sur 30 jours. « Peu de données » : moins de {MIN_CHANNEL_SIGNUPS} inscrits ou aucun payant, chiffre fragile.{" "}
                <Link href="/admin/simulateur">Tout simuler →</Link>
              </p>
            </Section>
          )}

          {insights.length > 0 && (
            <Section title="Analyse">
              <ul className="goal-insights">
                {insights.map((x, i) => (
                  <li key={i} style={{ animationDelay: `${i * 60}ms` }}>
                    <span aria-hidden>{x.icon}</span>
                    <span>{x.text}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {elapsedDays.length > 0 && (
            <Section title="Jour par jour">
              <Card title="Encaissé par jour">
                <BarChart times={elapsedDays.map((d) => d.t)} series={[{ name: "Encaissé", color: SERIES_COLORS[0], values: elapsedDays.map((d) => d.cents) }]} unit="eur" caption="Encaissé net par jour" />
              </Card>
              <div className="cockpit-card cockpit-scroll" style={{ padding: 0, marginTop: 12 }}>
                <table className="cockpit-table">
                  <thead>
                    <tr>
                      <th>Jour</th>
                      <th>Inscrits</th>
                      <th>Nouveaux payants</th>
                      <th>Encaissé</th>
                      <th>Cumul</th>
                      <th>Rythme cible</th>
                      <th>Écart</th>
                    </tr>
                  </thead>
                  <tbody>
                    {elapsedDays
                      .map((d, i) => ({ d, i }))
                      .reverse()
                      .map(({ d, i }) => {
                        const diff = progress.cumulative[i] - progress.pace[i];
                        return (
                          <tr key={d.key}>
                            <td>
                              <Link href={`/admin/inscriptions/${d.key}`} className="cockpit-row-link">
                                {shortDay(d.t)}
                              </Link>
                            </td>
                            <td>{int(d.signups)}</td>
                            <td>{int(d.newPayers)}</td>
                            <td style={{ fontWeight: 700 }}>{euros(d.cents)}</td>
                            <td>{euros(progress.cumulative[i])}</td>
                            <td>{euros(progress.pace[i])}</td>
                            <td>
                              <span className={`cockpit-pill ${diff >= 0 ? "is-good" : "is-warn"}`}>
                                {diff >= 0 ? "+" : "−"}
                                {euros(Math.abs(diff))}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
        </>
      )}

      <Section title="Fixer un objectif" subtitle="Pour n'importe quel mois (2027 compris). Un nouvel objectif remplace l'ancien ; 0 € l'efface.">
        {savedGoals.missingTable && (
          <div className="cockpit-card" style={{ marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700 }}>Une étape avant d&apos;enregistrer tes propres objectifs</p>
            <p style={{ margin: "6px 0 10px", fontSize: 13, color: muted }}>
              Octobre, novembre et décembre sont déjà là. Pour en ajouter : colle ce SQL dans Supabase → SQL Editor → Run.
            </p>
            <pre style={{ margin: 0, padding: 12, fontSize: 12, borderRadius: 8, background: "#fff", overflowX: "auto" }}>{GOALS_TABLE_SQL}</pre>
          </div>
        )}
        <form action={saveGoalAction} className="cockpit-card flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1" style={{ fontSize: 12, fontWeight: 600 }}>
            Mois
            <input name="month" type="month" required defaultValue={key === current ? nextFree : key} className="input" />
          </label>
          <label className="flex flex-col gap-1" style={{ fontSize: 12, fontWeight: 600 }}>
            Objectif (€)
            <input name="amount" required inputMode="decimal" placeholder="5000" className="input" style={{ width: 140 }} />
          </label>
          <button type="submit" className="btn btn-primary">
            Enregistrer
          </button>
        </form>
        <div className="flex flex-wrap gap-2" style={{ marginTop: 10 }}>
          {Object.entries(goals)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, cents]) => (
              <Link key={month} href={`/admin/objectifs?m=${month}`} className="cockpit-pill" style={{ textDecoration: "none" }}>
                {monthLabel(month)} · {euros(cents)}
                {savedGoals.goals[month] === undefined ? " (fixé le 26/10)" : ""}
              </Link>
            ))}
        </div>
        <form id="objectif-global" action={saveGlobalGoalAction} className="cockpit-card flex flex-wrap items-end gap-3" style={{ marginTop: 16, scrollMarginTop: 80 }}>
          <label className="flex flex-col gap-1" style={{ fontSize: 12, fontWeight: 600 }}>
            Objectif global : revenu total de Stageio (€)
            <input
              name="amount"
              required
              inputMode="decimal"
              placeholder={String(Math.round((savedGoals.globalCents ?? DEFAULT_GLOBAL_GOAL_CENTS) / 100))}
              className="input"
              style={{ width: 200 }}
            />
          </label>
          <button type="submit" className="btn btn-primary">
            Enregistrer
          </button>
          <span style={{ fontSize: 12, color: "var(--color-neutral-600)" }}>
            Actuel : {euros(savedGoals.globalCents ?? DEFAULT_GLOBAL_GOAL_CENTS)}
            {savedGoals.globalCents === null ? " (par défaut)" : ""} · affiché en haut de la vue d&apos;ensemble · 0 € = valeur par défaut
          </span>
        </form>
      </Section>
    </div>
  );
}
