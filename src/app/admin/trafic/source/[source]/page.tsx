import Link from "next/link";
import { Card, Kpi, KpiGrid, Section } from "@/components/admin/cockpit/Kpi";
import { BarChart } from "@/components/admin/cockpit/BarChart";
import { HBars } from "@/components/admin/cockpit/Visual";
import { PeopleTable } from "@/components/admin/cockpit/PeopleTable";
import { SERIES_COLORS } from "@/components/admin/cockpit/chartUtils";
import { int, pct, startOfParisDay } from "@/lib/admin/cockpit/format";
import { nowMs } from "@/lib/admin/cockpit/load";
import { hasPaid, journeys, profilesCreatedBetween } from "@/lib/admin/people";
import { DAY_MS, SIGNUPS_SINCE, daysBetween, dayKey, sourceInfo } from "@/lib/admin/trafficStats";
import { requireAdminPage } from "@/lib/admin/accessCode";

// Détail d'une source (25/10) : inscrits jour par jour, ce qu'ils déclarent
// à l'onboarding, combien paient, et la liste des comptes venus par là.
// Chaque jour du graphique ouvre le détail de ce jour. Uniquement des
// inscrits (Nathan : « ne compte que les inscrits ») : plus de visiteurs.
export const maxDuration = 60;

const PERIODS = [7, 30, 90] as const;
const rate = (n: number, d: number) => (d > 0 ? pct(n / d, 0) : "—");

export default async function SourcePage({ params, searchParams }: { params: Promise<{ source: string }>; searchParams: Promise<{ j?: string }> }) {
  await requireAdminPage();
  const { source } = await params;
  const { j } = await searchParams;
  const days = PERIODS.find((p) => String(p) === j) ?? 30;
  const info = sourceInfo(decodeURIComponent(source));
  const now = nowMs();
  const todayStart = startOfParisDay(now);
  const since = Math.max(SIGNUPS_SINCE, todayStart - (days - 1) * DAY_MS);
  const end = todayStart + DAY_MS;
  const matches = (raw: string | null | undefined) => sourceInfo(raw).label === info.label;

  const all = await profilesCreatedBetween(since, end).catch((err) => (console.error("trafic/source: comptes", err), null));
  const people = (all ?? []).filter((p) => matches(p.utm_source));
  const paths = await journeys(people.map((p) => p.id)).catch(() => new Map());

  const dayList = daysBetween(since, now);
  const signupsOn = new Map<string, number>();
  for (const p of people) {
    const k = dayKey(Date.parse(p.created_at));
    signupsOn.set(k, (signupsOn.get(k) ?? 0) + 1);
  }
  const onboarded = people.filter((p) => p.onboarding_completed).length;
  const paid = people.filter(hasPaid);
  const cents = people.reduce((s, p) => s + (p.total_paid_cents ?? 0), 0);
  const sawPaywall = people.filter((p) => (paths.get(p.id)?.paywall ?? 0) > 0).length;
  const byHeard = new Map<string, number>();
  for (const p of people) {
    const h = paths.get(p.id)?.heard ?? "Pas répondu";
    byHeard.set(h, (byHeard.get(h) ?? 0) + 1);
  }

  return (
    <div>
      <Link href="/admin/trafic" style={{ fontSize: 13 }}>
        ← Trafic et sources
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "10px 0 4px" }}>{info.label}</h1>
      <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--color-neutral-600)" }}>
        Canal : {info.group}. Inscrits venus par cette source (lien suivi à l&apos;inscription, dans les 30 jours avant).
      </p>
      <div className="seg" role="group" aria-label="Période">
        {PERIODS.map((p) => (
          <Link key={p} href={`/admin/trafic/source/${encodeURIComponent(source)}?j=${p}`} className={`seg-opt${p === days ? " is-active" : ""}`} style={{ padding: "7px 14px", fontSize: 13 }}>
            {p} jours
          </Link>
        ))}
      </div>

      <Section title={`${days} derniers jours`}>
        <KpiGrid>
          <Kpi accent="green" label="Inscrits" value={people.length} definition="Comptes créés sur la période avec cette source enregistrée à l'inscription." source="Supabase, profils.utm_source" />
          <Kpi accent="blue" label="Onboarding fini" value={onboarded} sub={rate(onboarded, people.length)} definition="Parmi ces inscrits, ceux qui ont fini le questionnaire de départ (à ce jour)." source="Supabase, profils" />
          <Kpi accent="violet" label="Ont vu la page Premium" value={sawPaywall} sub={rate(sawPaywall, people.length)} definition="Parmi ces inscrits, ceux qui ont ouvert la page Premium au moins une fois." source="Supabase, user_events" />
          <Kpi accent="amber" label="Payants" value={paid.length} sub={`${rate(paid.length, people.length)} · ${(cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`} definition="Parmi ces inscrits, ceux qui ont payé à ce jour (un accès offert ne compte pas), et le total qu'ils ont payé." source="Supabase, profils" />
        </KpiGrid>
      </Section>

      <Section title="Jour par jour" subtitle="Clique sur un jour pour voir qui s'est inscrit ce jour-là.">
        <Card title="Inscrits par jour">
          <BarChart
            times={dayList.map((d) => d.t)}
            series={[{ name: "Inscrits", color: SERIES_COLORS[0], values: dayList.map((d) => signupsOn.get(d.key) ?? 0) }]}
            unit="count"
            caption={`Inscrits venus de ${info.label} par jour`}
            hrefs={dayList.map((d) => `/admin/inscriptions/${d.key}`)}
          />
        </Card>
      </Section>

      <Section title="Ce qu'ils disent" subtitle="Réponse à « Tu nous as connus comment ? » des inscrits venus par cette source (commentaire, vidéo, carrousel… depuis le 25/10).">
        <Card>
          <HBars items={[...byHeard.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }))} color="#7c5cd6" />
        </Card>
      </Section>

      <Section title={`Les ${int(people.length)} inscrits`} subtitle="Du plus récent au plus ancien. Clique sur une personne pour sa fiche.">
        <Card>
          <PeopleTable people={people} journeys={paths} />
        </Card>
      </Section>
    </div>
  );
}
