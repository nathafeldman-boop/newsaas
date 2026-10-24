import { unstable_cache } from "next/cache";
import { Card, Section } from "@/components/admin/cockpit/Kpi";
import { PeriodBar } from "@/components/admin/cockpit/PeriodBar";
import { signupsIn } from "@/lib/admin/cockpit/db";
import { int, parsePeriod, pct, periodRanges, type PeriodDays } from "@/lib/admin/cockpit/format";
import { loadSnapshot, nowMs } from "@/lib/admin/cockpit/load";
import { activeAt, firstPaidBySub, paidSubs, renewalsIn } from "@/lib/admin/cockpit/metrics";
import { FEATURES, formatDuration, median, userFacts, type UserFacts } from "@/lib/admin/cockpit/usage";
import { requireAdminPage } from "@/lib/admin/accessCode";

// Utilisation des fonctionnalités : le parcours des inscrits (funnel), ce
// que les payants utilisent vraiment, et les fonctionnalités associées au
// renouvellement. Des corrélations, pas des causes.
export const maxDuration = 60;

const cohortFacts = unstable_cache(
  async (days: PeriodDays): Promise<UserFacts[]> => {
    const { current } = periodRanges(days, Date.now());
    const ids = await signupsIn(current);
    return [...(await userFacts(ids)).values()];
  },
  ["cockpit-funnel-facts-v3"],
  { revalidate: 1800 },
);

const payerFacts = unstable_cache(async (ids: string[]): Promise<UserFacts[]> => [...(await userFacts(ids)).values()], ["cockpit-payer-facts-v3"], {
  revalidate: 1800,
});

export default async function FonctionnalitesPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  await requireAdminPage();
  const { p } = await searchParams;
  const period = parsePeriod(p);
  const now = nowMs();
  const { snap, error } = await loadSnapshot();
  const facts = await cohortFacts(period).catch((err) => {
    console.error("cockpit: funnel en échec", err);
    return null;
  });

  if (!snap || !facts) {
    return (
      <Card>
        <p style={{ margin: 0 }}>Lecture impossible pour l&apos;instant ({error ?? "base de données"}).</p>
      </Card>
    );
  }

  // Paiement et renouvellement par compte, depuis Stripe.
  const firstPaid = firstPaidBySub(snap.invoices);
  const paid = paidSubs(snap, firstPaid);
  const paidAt = new Map<string, number>();
  const bump = (id: string | null, t: number) => {
    if (id && (!paidAt.has(id) || t < paidAt.get(id)!)) paidAt.set(id, t);
  };
  for (const s of paid) bump(s.userId, firstPaid.get(s.id)!);
  for (const o of snap.oneTime) bump(o.userId, o.created);
  const firstRenewals = renewalsIn(snap, { start: 0, end: now }, now, firstPaid).filter((r) => r.k === 1 && r.outcome !== "à venir");
  const renewedAt = new Map<string, number>();
  for (const r of firstRenewals) if (r.outcome === "réussi" && r.sub.userId) renewedAt.set(r.sub.userId, r.due);

  // Funnel : utilisateurs uniques inscrits pendant la période ; une étape est atteinte si elle a eu lieu au moins une fois.
  const steps: { label: string; at: (f: UserFacts) => number | null | undefined; note?: string }[] = [
    { label: "Inscription", at: (f) => f.signupAt },
    { label: "Onboarding terminé", at: (f) => f.onboardedAt },
    { label: "Premier like", at: (f) => f.first.like },
    { label: "Revenu un 2e jour", at: (f) => f.secondDayAt },
    { label: "Première candidature préparée", at: (f) => f.first.application, note: "offre ouverte, lettre écrite" },
    { label: "Candidature confirmée envoyée", at: (f) => f.first.application_marked_sent, note: "suivi depuis le 24/10" },
    { label: "Paiement (abonnement ou à vie)", at: (f) => paidAt.get(f.id) },
    { label: "1er renouvellement réussi", at: (f) => renewedAt.get(f.id), note: "abonnés dont l'échéance est passée" },
  ];
  const reached = steps.map((step) => facts.filter((f) => step.at(f) != null));
  const signups = facts.length;

  // Adoption : inscrits de la période vs payants en cours (abonnés à jour + accès à vie).
  const payerIds = [
    ...new Set([...paid.filter((s) => activeAt(s, now) && s.status !== "past_due" && s.status !== "unpaid").map((s) => s.userId), ...snap.oneTime.map((o) => o.userId)].filter((id): id is string => !!id)),
  ].sort();
  const payers = await payerFacts(payerIds).catch(() => [] as UserFacts[]);
  const share = (group: UserFacts[], key: (typeof FEATURES)[number]["key"]) => (group.length ? group.filter((f) => f.first[key] !== undefined).length / group.length : null);

  // Renouvellement selon l'usage avant l'échéance (abonnés avec un 1er renouvellement connu).
  const known = firstRenewals.filter((r) => r.outcome !== "inconnu" && r.sub.userId);
  const renewalFacts = await payerFacts([...new Set(known.map((r) => r.sub.userId!))].sort()).catch(() => [] as UserFacts[]);
  const factsById = new Map(renewalFacts.map((f) => [f.id, f]));
  const correlation = FEATURES.map((feat) => {
    const used = { n: 0, ok: 0 };
    const notUsed = { n: 0, ok: 0 };
    for (const r of known) {
      const f = factsById.get(r.sub.userId!);
      if (!f) continue;
      const t = f.first[feat.key];
      const bucket = t !== undefined && t <= r.due ? used : notUsed;
      bucket.n++;
      if (r.outcome === "réussi") bucket.ok++;
    }
    return { feat, used, notUsed };
  });

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Utilisation des fonctionnalités</h1>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--color-neutral-600)" }}>
        Le parcours des inscrits des {period} derniers jours, ce que les payants utilisent, et ce qui accompagne un renouvellement.
      </p>
      <PeriodBar path="/admin/fonctionnalites" period={period} computedAt={snap.computedAt} />

      <Section
        title={`Parcours des ${int(signups)} inscrits de la période`}
        subtitle="Utilisateurs uniques. Une étape compte si elle a eu lieu au moins une fois, même dans le désordre. Les inscrits récents ont eu moins de temps pour avancer."
      >
        <div className="cockpit-card cockpit-scroll" style={{ padding: 0 }}>
          <table className="cockpit-table">
            <thead>
              <tr>
                <th>Étape</th>
                <th>Utilisateurs</th>
                <th>Depuis l&apos;étape précédente</th>
                <th>Depuis l&apos;inscription</th>
                <th>Abandons</th>
                <th>Délai médian après l&apos;inscription</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((step, i) => {
                const n = reached[i].length;
                const prev = i > 0 ? reached[i - 1].length : n;
                const delays = reached[i].map((f) => (step.at(f) ?? f.signupAt) - f.signupAt).filter((d) => d >= 0);
                return (
                  <tr key={step.label}>
                    <td>
                      <strong>{step.label}</strong>
                      {step.note && <span style={{ color: "var(--color-neutral-500)" }}> · {step.note}</span>}
                    </td>
                    <td>{int(n)}</td>
                    <td>{i === 0 ? "—" : pct(prev ? n / prev : null)}</td>
                    <td>{pct(signups ? n / signups : null)}</td>
                    <td>{i === 0 ? "—" : int(Math.max(0, prev - n))}</td>
                    <td>{i === 0 ? "—" : formatDuration(median(delays))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Rétention d'usage"
        subtitle="Part des inscrits de la période revenus (connexion, swipe ou candidature) au moins une fois N jours ou plus après leur inscription. Seuls les inscrits assez anciens comptent (éligibles). Rétention d'usage, pas payante : voir Cohortes."
      >
        <div className="cockpit-card cockpit-scroll" style={{ padding: 0 }}>
          <table className="cockpit-table">
            <thead>
              <tr>
                <th>Retour</th>
                <th>Tous les inscrits</th>
                <th>Inscrits devenus payants</th>
              </tr>
            </thead>
            <tbody>
              {[1, 7, 30].map((d) => {
                const rate = (group: UserFacts[]) => {
                  const eligible = group.filter((f) => now - f.signupAt >= d * 86_400_000);
                  if (eligible.length === 0) return <span style={{ color: "var(--color-neutral-500)" }}>pas encore</span>;
                  const back = eligible.filter((f) => f.lastActivityAt >= f.signupAt + d * 86_400_000).length;
                  return `${pct(back / eligible.length, 0)} (${back}/${eligible.length})`;
                };
                return (
                  <tr key={d}>
                    <td>À partir de J+{d}</td>
                    <td>{rate(facts)}</td>
                    <td>{rate(facts.filter((f) => paidAt.has(f.id)))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Adoption des fonctionnalités" subtitle="Part des comptes qui ont utilisé chaque fonctionnalité au moins une fois.">
        <div className="cockpit-card cockpit-scroll" style={{ padding: 0 }}>
          <table className="cockpit-table">
            <thead>
              <tr>
                <th>Fonctionnalité</th>
                <th>Inscrits de la période ({int(facts.length)})</th>
                <th>Payants en cours ({int(payers.length)})</th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((feat) => (
                <tr key={feat.key}>
                  <td>
                    {feat.label}
                    {feat.since && <span style={{ color: "var(--color-neutral-500)" }}> · suivi depuis le {new Date(`${feat.since}T12:00:00Z`).toLocaleDateString("fr-FR")}</span>}
                  </td>
                  <td>{pct(share(facts, feat.key), 0)}</td>
                  <td>{pct(share(payers, feat.key), 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Renouvellement selon l'usage"
        subtitle="Abonnés dont le 1er renouvellement est passé : taux de renouvellement de ceux qui avaient utilisé la fonctionnalité avant l'échéance, et des autres. Une corrélation, pas une preuve : les plus motivés utilisent plus et renouvellent plus. Pour le prouver, il faut un test (montrer la fonctionnalité à la moitié des abonnés)."
      >
        <div className="cockpit-card cockpit-scroll" style={{ padding: 0 }}>
          <table className="cockpit-table">
            <thead>
              <tr>
                <th>Fonctionnalité</th>
                <th>L&apos;avaient utilisée</th>
                <th>Ne l&apos;avaient pas utilisée</th>
              </tr>
            </thead>
            <tbody>
              {correlation.map(({ feat, used, notUsed }) => (
                <tr key={feat.key}>
                  <td>{feat.label}</td>
                  <td>{used.n < 5 ? <span style={{ color: "var(--color-neutral-500)" }}>trop peu ({used.n})</span> : `${pct(used.ok / used.n, 0)} renouvellent (n = ${used.n})`}</td>
                  <td>{notUsed.n < 5 ? <span style={{ color: "var(--color-neutral-500)" }}>trop peu ({notUsed.n})</span> : `${pct(notUsed.ok / notUsed.n, 0)} renouvellent (n = ${notUsed.n})`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 11.5, color: "var(--color-neutral-500)", marginTop: 8 }}>
          Simulateur d&apos;entretien, panneau « Nouveautés » et suivi des candidatures : suivis depuis peu, leurs chiffres se rempliront avec le temps.
        </p>
      </Section>
    </div>
  );
}
