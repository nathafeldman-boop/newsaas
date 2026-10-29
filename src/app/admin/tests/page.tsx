import { Card, Kpi, KpiGrid, Section } from "@/components/admin/cockpit/Kpi";
import { requireAdminPage } from "@/lib/admin/accessCode";
import { dateTime, euros, int, pct } from "@/lib/admin/cockpit/format";
import { loadSnapshot, nowMs } from "@/lib/admin/cockpit/load";
import type { Range } from "@/lib/admin/cockpit/metrics";
import type { StripeSnapshot } from "@/lib/admin/cockpit/types";
import { withTimeout } from "@/lib/admin/dashboardStats";
import { emailOfferAmong, loadArmEvents } from "@/lib/admin/priceTestData";
import { armStats, PLAN_LABELS, probabilityTestBetter, purchasesIn, verdictFor, type ArmStats, type BuyerPlan, type Verdict } from "@/lib/admin/priceTestStats";
import { PRICE_TESTS, type PriceTest } from "@/lib/pricing/tests";

// Tests de prix (29/10, Nathan : « un onglet test, et à chaque test [...]
// tu mettras les stats, si c'est concluant ou pas »). Chaque test est
// comparé aux mêmes heures juste avant son début (même durée que ce qui a
// déjà tourné). Le verdict se lit sur le paywall seul : les personnes qui
// avaient une offre 48 h par email (prix à part) sont mises de côté, puis
// montrées avec tout le monde plus bas.
export const maxDuration = 60;

const muted = { color: "var(--color-neutral-600)" } as const;
const HOUR = 3_600_000;
const PLANS: BuyerPlan[] = ["premium_monthly", "premium_lifetime", "auto_monthly", "auto_lifetime"];

const TONES: Record<Verdict["tone"], { bg: string; border: string; icon: string }> = {
  good: { bg: "#e9f8ef", border: "#0f9c56", icon: "✅" },
  bad: { bg: "#fdecec", border: "#c2262b", icon: "❌" },
  neutral: { bg: "#fff7e6", border: "#d98a00", icon: "⚖️" },
  wait: { bg: "var(--color-surface)", border: "var(--color-divider)", icon: "⏳" },
};

type ArmData = { range: Range; events: { viewers: string[]; checkouts: string[]; emailOffer: string[] } | null; purchases: ReturnType<typeof purchasesIn>; buyerEmailOffer: Set<string> };

async function loadArm(snap: StripeSnapshot, range: Range): Promise<ArmData> {
  const startIso = new Date(range.start).toISOString();
  const endIso = new Date(range.end).toISOString();
  const purchases = purchasesIn(snap, range);
  const buyers = [...new Set(purchases.map((p) => p.userId).filter((u): u is string => !!u))];
  const [events, buyerEmailOffer] = await Promise.all([
    withTimeout(loadArmEvents(startIso, endIso).catch(() => null), 20_000, null).then((r) => r.value),
    emailOfferAmong(buyers, startIso, endIso).catch(() => new Set<string>()),
  ]);
  return { range, events, purchases, buyerEmailOffer };
}

function statsFor(arm: ArmData, paywallOnly: boolean): ArmStats | null {
  if (!arm.events) return null;
  const email = new Set([...arm.events.emailOffer, ...arm.buyerEmailOffer]);
  const keep = paywallOnly ? (u: string | null) => u !== null && !email.has(u) : () => true;
  return armStats({ viewers: arm.events.viewers, checkouts: arm.events.checkouts, purchases: arm.purchases }, keep);
}

export default async function TestsPage() {
  await requireAdminPage();
  const now = nowMs();
  const { snap, error } = await loadSnapshot();
  if (!snap) {
    return (
      <Card>
        <p style={{ margin: 0 }}>Lecture Stripe impossible pour l&apos;instant ({error}) : recharge dans quelques minutes.</p>
      </Card>
    );
  }
  const results = await Promise.all(PRICE_TESTS.map((t) => testResult(snap, t, now)));

  return (
    <div>
      <h1 style={{ fontSize: 24, margin: 0 }}>Tests de prix</h1>
      <p style={{ fontSize: 13.5, margin: "6px 0 0", maxWidth: "80ch", ...muted }}>
        Chaque test est comparé aux mêmes heures juste avant son début. Le chiffre qui tranche : l&apos;argent encaissé par personne qui voit le
        paywall. Un prix plus haut peut faire moins de payants mais plus d&apos;argent ; seul ce chiffre dit lequel l&apos;emporte.
      </p>
      {results.map((r) => (
        <TestBlock key={r.test.id} {...r} />
      ))}
    </div>
  );
}

async function testResult(snap: StripeSnapshot, test: PriceTest, now: number) {
  const plannedEnd = test.start + test.plannedMs;
  const end = Math.min(now, plannedEnd, test.end ?? Infinity);
  if (end <= test.start) return { test, now, started: false as const };
  const testRange = { start: test.start, end };
  const controlRange = { start: test.start - (end - test.start), end: test.start };
  const [control, current] = await Promise.all([loadArm(snap, controlRange), loadArm(snap, testRange)]);
  return { test, now, started: true as const, control, current, finished: end >= plannedEnd || test.end !== null, snapAt: snap.computedAt };
}

function TestBlock(props: Awaited<ReturnType<typeof testResult>>) {
  const { test, now } = props;
  const plannedEnd = test.start + test.plannedMs;
  const status = test.end
    ? `Terminé le ${dateTime(test.end)}`
    : now < test.start
      ? `Commence le ${dateTime(test.start)}`
      : now < plannedEnd
        ? `En cours : ${Math.floor((now - test.start) / HOUR)} h sur ${Math.round(test.plannedMs / HOUR)} h`
        : `Durée prévue écoulée le ${dateTime(plannedEnd)} : à toi de décider (garder ou revenir aux anciens prix)`;

  return (
    <Section title={test.title} subtitle={`Début ${dateTime(test.start)} · ${status}`}>
      <Card title="Ce qui change">
        <div style={{ overflowX: "auto" }}>
          <table className="cockpit-table" style={{ width: "100%", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Formule</th>
                <th>Avant</th>
                <th>Pendant le test</th>
              </tr>
            </thead>
            <tbody>
              {test.changes.map((c) => (
                <tr key={c.label}>
                  <td style={{ textAlign: "left", fontWeight: 600 }}>{c.label}</td>
                  <td>{c.before}</td>
                  <td style={{ fontWeight: 700 }}>{c.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {props.started ? <Results {...props} /> : <p style={{ fontSize: 13, margin: "12px 0 0", ...muted }}>Les chiffres apparaîtront dès le début du test.</p>}
    </Section>
  );
}

function Results(props: Extract<Awaited<ReturnType<typeof testResult>>, { started: true }>) {
  const { control, current, finished, snapAt } = props;
  const before = statsFor(control, true);
  const during = statsFor(current, true);
  const beforeAll = statsFor(control, false);
  const duringAll = statsFor(current, false);
  if (!before || !during || !beforeAll || !duringAll) {
    return <p style={{ fontSize: 13, margin: "12px 0 0" }}>Lecture des visites trop lente pour l&apos;instant (base chargée) : recharge dans quelques minutes.</p>;
  }
  const prob = probabilityTestBetter(before, during);
  const verdict = verdictFor(before, during, prob, finished);
  const tone = TONES[verdict.tone];
  const hours = Math.round((current.range.end - current.range.start) / HOUR);

  return (
    <>
      <div
        role="status"
        style={{ marginTop: 14, padding: "16px 18px", borderRadius: 14, background: tone.bg, border: `1.5px solid ${tone.border}` }}
      >
        <p style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>
          <span aria-hidden>{tone.icon} </span>
          {finished ? "Verdict : " : ""}
          {verdict.title.charAt(0).toUpperCase() + verdict.title.slice(1)}
        </p>
        <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.5 }}>{verdict.detail}</p>
      </div>

      <div style={{ marginTop: 14 }}>
        <KpiGrid>
          <Kpi
            hero
            accent="green"
            label="Revenu par personne qui voit le paywall"
            value={during.rpvCents !== null ? euros(Math.round(during.rpvCents), { decimals: true }) : "—"}
            sub={`Avant : ${before.rpvCents !== null ? euros(Math.round(before.rpvCents), { decimals: true }) : "—"}`}
            definition="1ers paiements encaissés (abonnements et achats à vie) ÷ personnes qui ont vu la page Premium, hors offre 48 h par email."
            source="Stripe (paiements) et événements paywall_viewed"
          />
          <Kpi
            accent="blue"
            label="Conversion"
            value={pct(during.conversion)}
            sub={`Avant : ${pct(before.conversion)}`}
            definition="Nouveaux payants ÷ personnes qui ont vu la page Premium, hors offre 48 h par email."
            source="Stripe et événements paywall_viewed"
          />
          <Kpi
            accent="violet"
            label="Panier moyen"
            value={during.aovCents !== null ? euros(Math.round(during.aovCents), { decimals: true }) : "—"}
            sub={`Avant : ${before.aovCents !== null ? euros(Math.round(before.aovCents), { decimals: true }) : "—"}`}
            definition="Montant moyen du 1er paiement des nouveaux payants."
            source="Stripe"
          />
          <Kpi
            accent="amber"
            label="Encaissé (1ers paiements)"
            value={euros(during.revenueCents)}
            sub={`Avant : ${euros(before.revenueCents)}`}
            definition="Somme des 1ers paiements des nouveaux payants pendant la période, hors offre 48 h par email."
            source="Stripe"
          />
        </KpiGrid>
      </div>

      <ArmTable title={`Paywall seul (hors offre 48 h par email) · ${hours} h avant / ${hours} h de test`} before={before} during={during} />
      <ArmTable title="Tout le monde (offre 48 h par email comprise)" before={beforeAll} during={duringAll} />

      <p style={{ fontSize: 12, lineHeight: 1.55, margin: "10px 0 0", maxWidth: "90ch", ...muted }}>
        Méthode : test du {dateTime(current.range.start)} au {dateTime(current.range.end)}, comparé au {dateTime(control.range.start)} →{" "}
        {dateTime(control.range.end)}. Les personnes qui avaient une offre 48 h par email ouverte (prix à part) sont mises de côté pour juger les prix du
        paywall. La probabilité vient de 4 000 tirages (taux de paiement et panier moyen tirés des vrais chiffres) ; on tranche sous 10 % ou
        au-dessus de 90 %. Les deux périodes ne tombent pas les mêmes jours de la semaine. Le revenu des renouvellements (un mensuel plus cher
        renouvelle-t-il autant ?) ne se verra qu&apos;au bout d&apos;un mois. Paiements Stripe relus toutes les 30 min (dernière lecture{" "}
        {dateTime(snapAt)}), visites toutes les 10 min.
      </p>
    </>
  );
}

function ArmTable({ title, before, during }: { title: string; before: ArmStats; during: ArmStats }) {
  const money = (c: number | null) => (c === null ? "—" : euros(Math.round(c), { decimals: true }));
  const diff = (a: number | null, b: number | null) => {
    if (a === null || b === null || a === 0) return "—";
    const d = Math.round(((b - a) / a) * 100);
    return `${d > 0 ? "+" : ""}${d} %`;
  };
  const rows: { label: string; a: string; b: string; d: string }[] = [
    { label: "Personnes qui voient le paywall", a: int(before.viewers), b: int(during.viewers), d: diff(before.viewers, during.viewers) },
    { label: "Paiements ouverts (page Stripe)", a: int(before.checkouts), b: int(during.checkouts), d: diff(before.checkouts, during.checkouts) },
    { label: "Nouveaux payants", a: int(before.buyers), b: int(during.buyers), d: diff(before.buyers, during.buyers) },
    { label: "Conversion", a: pct(before.conversion), b: pct(during.conversion), d: diff(before.conversion, during.conversion) },
    { label: "Encaissé (1ers paiements)", a: euros(before.revenueCents), b: euros(during.revenueCents), d: diff(before.revenueCents, during.revenueCents) },
    { label: "Revenu par personne qui voit le paywall", a: money(before.rpvCents), b: money(during.rpvCents), d: diff(before.rpvCents, during.rpvCents) },
    { label: "Panier moyen", a: money(before.aovCents), b: money(during.aovCents), d: diff(before.aovCents, during.aovCents) },
    ...PLANS.map((p) => ({
      label: `dont ${PLAN_LABELS[p]}`,
      a: `${int(before.byPlan[p].count)} · ${euros(before.byPlan[p].cents)}`,
      b: `${int(during.byPlan[p].count)} · ${euros(during.byPlan[p].cents)}`,
      d: "",
    })),
    { label: "Montées en gamme (Premium → Auto)", a: `${int(before.upgrades.count)} · ${euros(before.upgrades.cents)}`, b: `${int(during.upgrades.count)} · ${euros(during.upgrades.cents)}`, d: "" },
  ];
  return (
    <div className="cockpit-card" style={{ marginTop: 14, overflowX: "auto" }}>
      <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: "0 0 10px" }}>{title}</h3>
      <table className="cockpit-table" style={{ width: "100%", fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Indicateur</th>
            <th>Avant</th>
            <th>Test</th>
            <th>Écart</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} style={r.label.startsWith("dont") ? muted : undefined}>
              <td style={{ textAlign: "left", fontWeight: r.label.startsWith("dont") ? 400 : 600, paddingLeft: r.label.startsWith("dont") ? 18 : undefined }}>{r.label}</td>
              <td>{r.a}</td>
              <td style={{ fontWeight: 700 }}>{r.b}</td>
              <td>{r.d}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
