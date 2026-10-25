import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Kpi, KpiGrid, Section } from "@/components/admin/cockpit/Kpi";
import { HBars, MiniHistogram } from "@/components/admin/cockpit/Visual";
import { PeopleTable } from "@/components/admin/cockpit/PeopleTable";
import { pct, startOfParisDay } from "@/lib/admin/cockpit/format";
import { nowMs } from "@/lib/admin/cockpit/load";
import { hasPaid, journeys, profilesCreatedBetween } from "@/lib/admin/people";
import { SIGNUPS_SINCE, dayKey, sourceInfo, sourceKey } from "@/lib/admin/trafficStats";
import { requireAdminPage } from "@/lib/admin/accessCode";

// Détail d'un jour d'inscriptions (25/10, Nathan : « je clique sur un jour,
// je veux tout savoir sur les inscrits de ce jour-là, s'ils ont payé… ») :
// chiffres du jour, parcours jusqu'au paiement, heures, sources, réponses à
// l'onboarding, et la liste des comptes (chacun ouvre sa fiche).
export const maxDuration = 60;

// en-GB : « 23 » tout court (fr-FR écrit « 23 h »).
const hourFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", hourCycle: "h23" });
const rate = (n: number, d: number) => (d > 0 ? pct(n / d, 0) : "—");

export default async function SignupDayPage({ params }: { params: Promise<{ jour: string }> }) {
  await requireAdminPage();
  const { jour } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(jour)) notFound();
  const start = startOfParisDay(Date.parse(`${jour}T12:00:00Z`));
  if (!Number.isFinite(start) || dayKey(start) !== jour) notFound();
  const end = startOfParisDay(start + 36 * 3600_000);
  const now = nowMs();
  const today = dayKey(now);
  const prevDay = dayKey(start - 12 * 3600_000);
  const nextDay = dayKey(end + 12 * 3600_000);
  const longDate = new Date(Date.parse(`${jour}T12:00:00Z`)).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

  const people = await profilesCreatedBetween(start, end).catch((err) => (console.error("inscriptions/jour: comptes", err), null));
  if (!people) {
    return (
      <Card>
        <p style={{ margin: 0, fontSize: 14 }}>Lecture des comptes impossible pour l&apos;instant. Réessayer dans une minute.</p>
      </Card>
    );
  }
  const paths = await journeys(people.map((p) => p.id)).catch(() => new Map());

  const onboarded = people.filter((p) => p.onboarding_completed).length;
  const sawPaywall = people.filter((p) => (paths.get(p.id)?.paywall ?? 0) > 0).length;
  const openedCheckout = people.filter((p) => (paths.get(p.id)?.checkout ?? 0) > 0).length;
  const paid = people.filter(hasPaid).length;
  const cents = people.reduce((s, p) => s + (p.total_paid_cents ?? 0), 0);

  const hours = Array.from({ length: 24 }, () => 0);
  for (const p of people) hours[Number(hourFmt.format(Date.parse(p.created_at)))]++;

  const bySource = new Map<string, { key: string; signups: number; paid: number }>();
  for (const p of people) {
    const info = sourceInfo(p.utm_source);
    const row = bySource.get(info.label) ?? { key: sourceKey(p.utm_source), signups: 0, paid: 0 };
    row.signups++;
    if (hasPaid(p)) row.paid++;
    bySource.set(info.label, row);
  }
  const byGroup = new Map<string, number>();
  for (const p of people) {
    const group = sourceInfo(p.utm_source).group;
    byGroup.set(group, (byGroup.get(group) ?? 0) + 1);
  }
  const byHeard = new Map<string, number>();
  for (const p of people) {
    const h = paths.get(p.id)?.heard ?? "Pas répondu";
    byHeard.set(h, (byHeard.get(h) ?? 0) + 1);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 13 }}>
        <Link href="/admin/inscriptions">← Tous les jours</Link>
        <span style={{ display: "flex", gap: 12 }}>
          {start > SIGNUPS_SINCE && <Link href={`/admin/inscriptions/${prevDay}`}>‹ {prevDay.slice(8, 10)}/{prevDay.slice(5, 7)}</Link>}
          {jour < today && <Link href={`/admin/inscriptions/${nextDay}`}>{nextDay.slice(8, 10)}/{nextDay.slice(5, 7)} ›</Link>}
        </span>
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "10px 0 4px", textTransform: "capitalize" }}>{longDate}</h1>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--color-neutral-600)" }}>
        Les comptes créés ce jour-là (heure de Paris){jour === today ? ", journée en cours" : ""}. Clique sur une personne pour sa fiche, sur une source pour son détail.
      </p>

      <KpiGrid>
        <Kpi hero accent="green" label="Inscrits" value={people.length} definition="Comptes créés ce jour-là, heure de Paris." source="Supabase, profils" />
        <Kpi accent="blue" label="Onboarding fini" value={onboarded} sub={rate(onboarded, people.length)} definition="Parmi les inscrits du jour, ceux qui ont fini le questionnaire de départ (à ce jour)." source="Supabase, profils" />
        <Kpi accent="violet" label="Ont vu la page Premium" value={sawPaywall} sub={rate(sawPaywall, people.length)} definition="Parmi les inscrits du jour, ceux qui ont ouvert au moins une fois la page Premium (à ce jour)." source="Supabase, user_events paywall_viewed" />
        <Kpi accent="amber" label="Ont ouvert le paiement" value={openedCheckout} sub={rate(openedCheckout, sawPaywall)} definition="Parmi les inscrits du jour, ceux qui ont cliqué jusqu'à la page de paiement Stripe. Pourcentage : parmi ceux qui ont vu la page Premium." source="Supabase, user_events checkout_opened" />
        <Kpi accent="pink" label="Ont payé" value={paid} sub={`${rate(paid, people.length)} · ${(cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € encaissés`} definition="Parmi les inscrits du jour, ceux qui ont payé à ce jour (abonnement, accès à vie ou Auto ; un accès offert par code ne compte pas). Montant : total payé par ces comptes depuis." source="Supabase, profils (paiements notés par le webhook Stripe)" />
      </KpiGrid>

      <Section title="Leur parcours" subtitle="Combien sont allés jusqu'à chaque étape, à ce jour.">
        <Card>
          <HBars
            items={[
              { label: "Comptes créés", value: people.length },
              { label: "Onboarding fini", value: onboarded, note: rate(onboarded, people.length) },
              { label: "Page Premium vue", value: sawPaywall, note: rate(sawPaywall, people.length) },
              { label: "Paiement ouvert", value: openedCheckout, note: rate(openedCheckout, people.length) },
              { label: "Ont payé", value: paid, note: rate(paid, people.length) },
            ]}
            color="#0f9c56"
          />
        </Card>
      </Section>

      <Section title="Quand et d'où">
        <div className="cockpit-grid-2">
          <Card title="Inscriptions par heure">
            <MiniHistogram values={hours} labels={hours.map((_, h) => `${h} h`)} color="#2a78d6" title="Inscriptions par heure" />
          </Card>
          <Card title="Arrivés via (lien suivi)">
            <HBars
              items={[...bySource.entries()]
                .sort((a, b) => b[1].signups - a[1].signups)
                .map(([label, r]) => ({ label, value: r.signups, note: r.paid > 0 ? `${r.paid} payant${r.paid > 1 ? "s" : ""}` : undefined, href: `/admin/trafic/source/${encodeURIComponent(r.key)}` }))}
              color="#e87ba4"
            />
          </Card>
          <Card title="Ce qu'ils ont répondu à « Tu nous as connus comment ? »">
            <HBars
              items={[...byHeard.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }))}
              color="#7c5cd6"
            />
          </Card>
          <Card title="Par canal">
            <HBars
              items={[...byGroup.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value, note: rate(value, people.length) }))}
              color="#d98a00"
            />
          </Card>
        </div>
      </Section>

      <Section title={`Les ${people.length} inscrits`} subtitle="Du plus récent au plus ancien. Clique sur une personne pour voir son parcours complet.">
        <Card>
          <PeopleTable people={people} journeys={paths} timeOnly />
        </Card>
      </Section>
    </div>
  );
}
