import Link from "next/link";
import { Card, Kpi, KpiGrid, Section } from "@/components/admin/cockpit/Kpi";
import { MonthBars } from "@/components/admin/goals/MonthBars";
import { requireAdminPage } from "@/lib/admin/accessCode";
import { euros, monthRange } from "@/lib/admin/cockpit/format";
import { loadSnapshot, nowMs } from "@/lib/admin/cockpit/load";
import { firstPaidBySub } from "@/lib/admin/cockpit/metrics";
import { expectedRenewals, monthLabel, monthProgress, shiftMonth } from "@/lib/admin/goals";
import { getMeasuredRates, monthDays } from "@/lib/admin/goalsData";
import { actualFor, daysIn, forecastFor, totalRevenue, type HistoryRow } from "@/lib/admin/history";
import { signupsByDay } from "@/lib/admin/traffic";

// Historique (28/10, Nathan : « l'argent qu'on a fait chaque mois, le
// nombre d'utilisateurs qu'on a fait chaque mois, la prévisualisation de ce
// qu'on va faire normalement ») : un mois par ligne depuis les premiers
// paiements, le mois en cours avec sa projection, et les 2 mois suivants en
// prévision. Argent : Stripe (net des remboursements) ; inscrits : comptes
// créés (heure de Paris) ; prévision : rythmes mesurés (voir lib/admin/history).
export const maxDuration = 60;

const FIRST_MONTH = "2026-09";
const FORECAST_MONTHS = 2;
const muted = { color: "var(--color-neutral-600)" } as const;
const int = (n: number) => n.toLocaleString("fr-FR").replace(/ /g, " ");
const shortMonth = (key: string) => monthLabel(key).replace(/ 20(\d\d)$/, " $1");

export default async function HistoriquePage() {
  await requireAdminPage();
  const now = nowMs();
  const current = monthRange(undefined, now);
  const [{ snap, error }, rates, signupDays] = await Promise.all([
    loadSnapshot(),
    getMeasuredRates().catch(() => null),
    signupsByDay(new Date(monthRange(FIRST_MONTH, now).range.start).toISOString()).catch(() => null),
  ]);
  if (!snap) {
    return (
      <Card>
        <p style={{ margin: 0 }}>Lecture Stripe impossible pour l&apos;instant ({error}) : recharge dans quelques minutes.</p>
      </Card>
    );
  }

  const signupsByMonth = new Map<string, number>();
  for (const d of signupDays ?? []) signupsByMonth.set(d.day.slice(0, 7), (signupsByMonth.get(d.day.slice(0, 7)) ?? 0) + d.signups);
  const firstPaid = firstPaidBySub(snap.invoices);
  const daily = rates
    ? { firstPaymentCents: rates.firstPaymentCents / rates.windowDays, firstPayments: rates.firstPayments / rates.windowDays, signups: rates.signups / rates.windowDays }
    : null;

  // Mois en cours : projection de fin de mois (même calcul que l'onglet Objectifs).
  const currentDays = await monthDays(snap, current.range, now);
  const projection = monthProgress(
    currentDays.map((d) => ({ t: d.t, cents: d.cents })),
    0,
    now,
    true,
  ).projectionCents;

  const rows: HistoryRow[] = [];
  for (let key = FIRST_MONTH; key <= shiftMonth(current.key, FORECAST_MONTHS); key = shiftMonth(key, 1)) {
    const { range } = monthRange(key, now);
    const kind: HistoryRow["kind"] = key < current.key ? "past" : key === current.key ? "current" : "forecast";
    const actual = kind === "forecast" ? { revenueCents: 0, renewalCents: 0, newPayers: 0 } : actualFor(snap, range, firstPaid);
    const signups = kind === "forecast" ? 0 : signupDays ? (signupsByMonth.get(key) ?? 0) : null;
    rows.push({
      key,
      kind,
      ...actual,
      signups,
      forecast:
        kind === "past"
          ? null
          : forecastFor({
              kind,
              days: daysIn(range),
              elapsedDays: Math.max(0, (now - range.start) / 86_400_000),
              actual: { revenueCents: actual.revenueCents, signups, newPayers: actual.newPayers },
              projectionCents: kind === "current" ? projection : null,
              renewalCents: kind === "forecast" ? expectedRenewals(snap, range, now).cents : 0,
              rates: daily,
            }),
    });
  }

  const real = rows.filter((r) => r.kind !== "forecast");
  const total = totalRevenue(snap, now);
  const best = real.reduce<HistoryRow | null>((b, r) => (!b || r.revenueCents > b.revenueCents ? r : b), null);
  const signupsTotal = signupDays ? real.reduce((a, r) => a + (r.signups ?? 0), 0) : null;
  const payersTotal = real.reduce((a, r) => a + r.newPayers, 0);
  let running = 0;
  const cumulative = new Map(real.map((r) => [r.key, (running += r.revenueCents)]));

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Historique</h1>
      <p style={{ margin: "0 0 16px", fontSize: 13, maxWidth: "80ch", ...muted }}>
        L&apos;argent encaissé et les inscrits mois par mois, depuis les premiers paiements, avec la prévision du mois en cours et des {FORECAST_MONTHS} suivants.
        Objectifs du mois dans <Link href="/admin/objectifs">Objectifs</Link>.
      </p>

      <KpiGrid>
        <Kpi hero label="Revenu total de Stageio" value={euros(total.netCents)} sub={total.refundedCents > 0 ? `après ${euros(total.refundedCents)} de remboursements` : "aucun remboursement"} definition="Tout l'argent encaissé depuis le premier paiement, net des remboursements." source="Stripe" />
        <Kpi label="Meilleur mois" value={best ? euros(best.revenueCents) : "—"} sub={best ? monthLabel(best.key) : undefined} definition="Le mois où Stageio a le plus encaissé (net)." source="Stripe" />
        <Kpi label="Inscrits au total" value={signupsTotal !== null ? int(signupsTotal) : "—"} sub={`depuis ${monthLabel(FIRST_MONTH)}`} definition="Comptes créés depuis le premier mois de l'historique." source="Supabase (profils)" />
        <Kpi label="Payants au total" value={int(payersTotal)} sub="1ers abonnements et accès à vie" definition="Nouveaux payants additionnés mois par mois (un abonnement ou un accès à vie payé pour la première fois)." source="Stripe" />
      </KpiGrid>

      <Section title="Argent encaissé par mois" subtitle="Net des remboursements. Hachuré : prévision (reste du mois en cours, mois à venir).">
        <Card>
          <MonthBars
            title="Encaissé par mois"
            unit="eur"
            bars={rows.map((r) => ({ key: r.key, label: shortMonth(r.key), actual: r.revenueCents, forecast: r.forecast ? r.forecast.revenueCents : null }))}
          />
        </Card>
      </Section>

      <Section title="Inscrits par mois" subtitle="Comptes créés chaque mois. Hachuré : prévision au rythme actuel.">
        <Card>
          {signupDays ? (
            <MonthBars
              title="Inscrits par mois"
              unit="count"
              bars={rows.map((r) => ({ key: r.key, label: shortMonth(r.key), actual: r.signups ?? 0, forecast: r.forecast?.signups ?? null }))}
            />
          ) : (
            <p style={{ margin: 0, fontSize: 13 }}>Inscrits indisponibles pour l&apos;instant (base lente) : recharge dans quelques minutes.</p>
          )}
        </Card>
      </Section>

      <Section title="Mois par mois">
        <div className="cockpit-card" style={{ overflowX: "auto" }}>
          <table className="cockpit-table" style={{ width: "100%", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Mois</th>
                <th>Encaissé</th>
                <th>dont renouvellements</th>
                <th>Nouveaux payants</th>
                <th>Inscrits</th>
                <th>Conversion</th>
                <th>Cumul encaissé</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const f = r.forecast;
                const isForecast = r.kind === "forecast";
                const conv = !isForecast && r.signups ? r.newPayers / r.signups : null;
                return (
                  <tr key={r.key} style={isForecast ? { fontStyle: "italic", ...muted } : undefined}>
                    <td style={{ textAlign: "left", fontWeight: 700 }}>
                      <span style={{ textTransform: "capitalize" }}>{monthLabel(r.key)}</span>
                      {r.kind === "current" ? <span className="cockpit-pill" style={{ marginLeft: 6, fontStyle: "normal" }}>en cours</span> : null}
                      {isForecast ? <span className="cockpit-pill" style={{ marginLeft: 6, fontStyle: "normal" }}>prévision</span> : null}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {isForecast ? `≈ ${euros(f?.revenueCents ?? 0)}` : euros(r.revenueCents)}
                      {r.kind === "current" && f ? <div style={{ fontSize: 11.5, fontWeight: 600, ...muted }}>≈ {euros(f.revenueCents)} en fin de mois</div> : null}
                    </td>
                    <td>{isForecast ? "—" : euros(r.renewalCents)}</td>
                    <td>
                      {isForecast ? (f?.newPayers !== null && f?.newPayers !== undefined ? `≈ ${int(f.newPayers)}` : "—") : int(r.newPayers)}
                      {r.kind === "current" && f?.newPayers != null ? <div style={{ fontSize: 11.5, ...muted }}>≈ {int(f.newPayers)} fin de mois</div> : null}
                    </td>
                    <td>
                      {isForecast ? (f?.signups != null ? `≈ ${int(f.signups)}` : "—") : r.signups !== null ? int(r.signups) : "—"}
                      {r.kind === "current" && f?.signups != null ? <div style={{ fontSize: 11.5, ...muted }}>≈ {int(f.signups)} fin de mois</div> : null}
                    </td>
                    <td>{conv !== null ? `${(conv * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %` : "—"}</td>
                    <td>{isForecast ? "—" : euros(cumulative.get(r.key) ?? 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12, lineHeight: 1.5, margin: "10px 0 0", maxWidth: "90ch", ...muted }}>
          Prévision, jamais une promesse : mois en cours = encaissé à date + rythme des 7 derniers jours (comme dans Objectifs), inscrits et payants au prorata
          des jours écoulés. Mois suivants = renouvellements attendus des abonnés actuels (pondérés par les taux de renouvellement mesurés) + nouveaux paiements
          au rythme des {rates?.windowDays ?? 30} derniers jours{rates ? ` (${euros(Math.round(rates.firstPaymentCents))} de 1ers paiements, ${int(rates.signups)} inscrits)` : ""}. Les
          renouvellements des futurs abonnés ne sont pas comptés : estimation prudente.
        </p>
      </Section>
    </div>
  );
}
