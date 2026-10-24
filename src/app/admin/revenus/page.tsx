import Link from "next/link";
import { Card, Kpi, KpiGrid, Section } from "@/components/admin/cockpit/Kpi";
import { PeriodBar } from "@/components/admin/cockpit/PeriodBar";
import { LineChart } from "@/components/admin/cockpit/LineChart";
import { BarChart } from "@/components/admin/cockpit/BarChart";
import { SERIES_COLORS } from "@/components/admin/cockpit/chartUtils";
import { profilesByIds } from "@/lib/admin/cockpit/db";
import { date, delta, euros, int, maskEmail, parsePeriod, periodRanges } from "@/lib/admin/cockpit/format";
import { loadSnapshot, nowMs } from "@/lib/admin/cockpit/load";
import { DAY_MS, currentState, dailyRevenue, firstPaidBySub, mrrSeries, paidSubs, planLabel, revenueIn } from "@/lib/admin/cockpit/metrics";
import { requireAdminPage } from "@/lib/admin/accessCode";

// Revenus et MRR : ce que Stageio encaisse réellement (Stripe), séparé en
// récurrent et ponctuel, remboursements à part, et le détail des paiements.
export const maxDuration = 60;

type PaymentRow = {
  at: number;
  amount: number;
  kind: "1er paiement" | "Renouvellement" | "Accès à vie" | "Remboursement" | "Échec";
  plan: string;
  status: string;
  userId: string | null;
  stripeUrl: string | null;
};

const KINDS: PaymentRow["kind"][] = ["1er paiement", "Renouvellement", "Accès à vie", "Remboursement", "Échec"];

export default async function RevenusPage({ searchParams }: { searchParams: Promise<{ p?: string; type?: string }> }) {
  await requireAdminPage();
  const { p, type } = await searchParams;
  const period = parsePeriod(p);
  const now = nowMs();
  const { current, previous } = periodRanges(period, now);
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
  const subById = new Map(snap.subs.map((s) => [s.id, s]));
  const state = currentState(paid, now);
  const revCur = revenueIn(snap, current);
  const revPrev = revenueIn(snap, previous);
  const series = mrrSeries(paid, current);
  const daily = dailyRevenue(snap, current);
  const inCur = (t: number | null) => t !== null && t >= current.start && t < current.end;

  // Mouvements par jour : nouveaux abonnements et abonnements terminés.
  const days = series.map((x) => x.t);
  const dayIndex = (t: number) => Math.floor((t - current.start) / DAY_MS);
  const newPerDay = days.map(() => 0);
  const lostPerDay = days.map(() => 0);
  for (const s of paid) {
    const fp = firstPaid.get(s.id) ?? null;
    if (inCur(fp)) newPerDay[dayIndex(fp!)]++;
    if (inCur(s.endedAt)) lostPerDay[dayIndex(s.endedAt!)]++;
  }

  const userByCustomer = new Map<string, string>();
  for (const s of snap.subs) if (s.userId) userByCustomer.set(s.customer, s.userId);
  for (const o of snap.oneTime) if (o.customer) userByCustomer.set(o.customer, o.userId);

  const rows: PaymentRow[] = [];
  for (const inv of snap.invoices) {
    if (!inv.subscription) continue;
    const sub = subById.get(inv.subscription);
    const base = { plan: sub ? planLabel(sub) : "—", userId: sub?.userId ?? userByCustomer.get(inv.customer) ?? null, stripeUrl: `https://dashboard.stripe.com/invoices/${inv.id}` };
    if (inv.status === "paid" && inv.amountPaid > 0 && inCur(inv.paidAt ?? inv.created)) {
      rows.push({ ...base, at: inv.paidAt ?? inv.created, amount: inv.amountPaid, kind: inv.billingReason === "subscription_cycle" ? "Renouvellement" : "1er paiement", status: "payé" });
    } else if (inv.attemptCount > 0 && (inv.status === "open" || inv.status === "uncollectible") && inCur(inv.created)) {
      rows.push({ ...base, at: inv.created, amount: inv.amountDue, kind: "Échec", status: inv.status === "open" ? "en attente" : "irrécouvrable" });
    }
  }
  for (const o of snap.oneTime) {
    if (!inCur(o.created)) continue;
    rows.push({ at: o.created, amount: o.amountCents, kind: "Accès à vie", plan: "Accès à vie", status: "payé", userId: o.userId, stripeUrl: o.invoice ? `https://dashboard.stripe.com/invoices/${o.invoice}` : null });
  }
  for (const r of snap.refunds) {
    if (!inCur(r.created)) continue;
    rows.push({ at: r.created, amount: -r.amount, kind: "Remboursement", plan: "—", status: "remboursé", userId: userByCustomer.get(r.customer) ?? null, stripeUrl: `https://dashboard.stripe.com/customers/${r.customer}` });
  }
  rows.sort((a, b) => b.at - a.at);
  const kindFilter = KINDS.find((k) => k === type) ?? null;
  const shown = (kindFilter ? rows.filter((r) => r.kind === kindFilter) : rows).slice(0, 300);
  const profiles = await profilesByIds(shown.map((r) => r.userId).filter((id): id is string => !!id)).catch(() => new Map());

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Revenus et MRR</h1>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--color-neutral-600)" }}>Ce qui est réellement encaissé, sans mélanger récurrent, ponctuel et remboursements.</p>
      <PeriodBar path="/admin/revenus" period={period} computedAt={snap.computedAt} />

      <Section title="MRR">
        <KpiGrid>
          <Kpi
            hero
            label="MRR actuel"
            value={euros(state.mrr)}
            sub={`${state.active} abonnements à jour de paiement`}
            definition="Somme des abonnements en cours et à jour, ramenés au mois. Hebdomadaire : × 52 / 12. Annuel : / 12. Remises récurrentes déduites. Hors accès à vie (paiement unique, pas récurrent)."
            source="Stripe, abonnements"
          />
          <Kpi
            label="MRR à risque"
            value={euros(state.scheduled.mrr)}
            sub={`${state.scheduled.count} résiliation(s) programmée(s), comptées jusqu'à leur échéance`}
            definition="Part du MRR actuel dont l'abonnement est résilié mais encore payé jusqu'à la fin de sa période. Il quittera le MRR à l'échéance."
            source="Stripe, cancel_at"
          />
          <Kpi
            label="MRR en impayé"
            value={euros(state.pastDue.mrr)}
            sub={`${state.pastDue.count} abonnement(s) past_due ou unpaid, hors MRR`}
            definition="Abonnements dont le dernier paiement a échoué et n'est pas encore régularisé. Exclus du MRR actuel."
            source="Stripe, statut de l'abonnement"
          />
          {state.paused.count > 0 && (
            <Kpi label="En pause" value={euros(state.paused.mrr)} sub={`${state.paused.count} abonnement(s)`} definition="Abonnements avec encaissement suspendu. Exclus du MRR." source="Stripe, pause_collection" />
          )}
        </KpiGrid>
        <div className="cockpit-card" style={{ marginTop: 12 }}>
          <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: "0 0 8px" }}>Par formule</h3>
          <div className="cockpit-scroll">
            <table className="cockpit-table">
              <thead>
                <tr>
                  <th>Formule</th>
                  <th>Abonnés</th>
                  <th>MRR</th>
                </tr>
              </thead>
              <tbody>
                {state.byPlan.map((pl) => (
                  <tr key={pl.label}>
                    <td>{pl.label}</td>
                    <td>{int(pl.count)}</td>
                    <td>{euros(pl.mrr)}</td>
                  </tr>
                ))}
                {state.byPlan.length === 0 && (
                  <tr>
                    <td colSpan={3}>Aucun abonnement en cours.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {snap.otherCurrencySubs > 0 && (
            <p style={{ fontSize: 12, color: "var(--color-neutral-600)", margin: "8px 0 0" }}>{snap.otherCurrencySubs} abonnement(s) dans une autre devise, hors MRR.</p>
          )}
        </div>
      </Section>

      <Section title="Encaissements">
        <KpiGrid>
          <Kpi
            label="Abonnements"
            value={euros(revCur.recurringCents)}
            delta={delta(revCur.recurringCents, revPrev.recurringCents, (n) => euros(n))}
            definition="Factures d'abonnement payées pendant la période (premiers paiements et renouvellements)."
            source="Stripe, factures"
          />
          <Kpi
            label="Accès à vie"
            value={euros(revCur.oneTimeCents)}
            delta={delta(revCur.oneTimeCents, revPrev.oneTimeCents, (n) => euros(n))}
            definition="Paiements uniques de l'accès à vie pendant la période. Non récurrents : jamais dans le MRR."
            source="Stripe, sessions de paiement"
          />
          <Kpi
            label="Remboursements"
            value={euros(revCur.refundedCents)}
            delta={delta(revCur.refundedCents, revPrev.refundedCents, (n) => euros(n))}
            goodWhen="down"
            sub={`${revCur.refunds} remboursement(s)${revCur.disputes > 0 ? ` · ${revCur.disputes} litige(s), ${euros(revCur.disputedCents)}` : ""}`}
            definition="Remboursements réussis pendant la période. Les litiges bancaires (chargebacks) sont comptés à part."
            source="Stripe, remboursements et litiges"
          />
          <Kpi
            label="Net encaissé"
            value={euros(revCur.netCents)}
            delta={delta(revCur.netCents, revPrev.netCents, (n) => euros(n))}
            sub="Frais Stripe non déduits"
            definition="Encaissé (abonnements + accès à vie) − remboursements. Les frais Stripe ne sont pas lus : le revenu net après frais n'est pas calculé ici."
            source="Stripe"
          />
        </KpiGrid>
      </Section>

      <Section title="Évolution">
        <div className="cockpit-grid-2">
          <Card title="MRR quotidien (impayés compris)">
            <LineChart times={days} series={[{ name: "MRR", color: SERIES_COLORS[0], values: series.map((x) => x.mrr) }]} unit="eur" caption="MRR quotidien" />
          </Card>
          <Card title="Encaissements par jour">
            <BarChart
              times={daily.map((x) => x.t)}
              series={[
                { name: "Abonnements", color: SERIES_COLORS[0], values: daily.map((x) => x.recurring) },
                { name: "Accès à vie", color: SERIES_COLORS[1], values: daily.map((x) => x.oneTime) },
              ]}
              unit="eur"
              caption="Encaissements quotidiens"
            />
          </Card>
          <Card title="Abonnements gagnés et perdus par jour">
            <BarChart
              mode="grouped"
              times={days}
              series={[
                { name: "Nouveaux", color: SERIES_COLORS[0], values: newPerDay },
                { name: "Terminés", color: SERIES_COLORS[1], values: lostPerDay },
              ]}
              unit="count"
              caption="Nouveaux abonnements et abonnements terminés par jour"
            />
          </Card>
          <Card title="Abonnements en cours">
            <LineChart times={days} series={[{ name: "Abonnements", color: SERIES_COLORS[0], values: series.map((x) => x.active) }]} unit="count" caption="Abonnements en cours par jour" />
          </Card>
        </div>
      </Section>

      <Section title="Paiements de la période" subtitle={`${rows.length} mouvement(s). Les 300 plus récents sont affichés.`}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          <Link href={`/admin/revenus?p=${period}`} className={`cockpit-pill${kindFilter ? "" : " is-good"}`} style={{ textDecoration: "none" }}>
            Tous
          </Link>
          {KINDS.map((k) => (
            <Link key={k} href={`/admin/revenus?p=${period}&type=${encodeURIComponent(k)}`} className={`cockpit-pill${kindFilter === k ? " is-good" : ""}`} style={{ textDecoration: "none" }}>
              {k} ({rows.filter((r) => r.kind === k).length})
            </Link>
          ))}
        </div>
        <div className="cockpit-card cockpit-scroll" style={{ padding: 0, maxHeight: 560, overflowY: "auto" }}>
          <table className="cockpit-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Montant</th>
                <th>Type</th>
                <th>Formule</th>
                <th>Statut</th>
                <th>Client</th>
                <th>Stripe</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r, i) => (
                <tr key={`${r.at}-${i}`}>
                  <td>{date(r.at)}</td>
                  <td>{euros(r.amount)}</td>
                  <td>{r.kind}</td>
                  <td>{r.plan}</td>
                  <td>{r.status}</td>
                  <td>{r.userId ? <Link href={`/admin/users/${r.userId}`}>{maskEmail(profiles.get(r.userId)?.email ?? null)}</Link> : "—"}</td>
                  <td>{r.stripeUrl ? <a href={r.stripeUrl} target="_blank" rel="noreferrer">Ouvrir ↗</a> : "—"}</td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={7}>Aucun paiement sur la période.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
