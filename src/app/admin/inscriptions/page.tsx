import Link from "next/link";
import { Card, Insufficient, Kpi, KpiGrid, Section } from "@/components/admin/cockpit/Kpi";
import { BarChart } from "@/components/admin/cockpit/BarChart";
import { LineChart } from "@/components/admin/cockpit/LineChart";
import { SERIES_COLORS } from "@/components/admin/cockpit/chartUtils";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { int, pct } from "@/lib/admin/cockpit/format";
import { nowMs } from "@/lib/admin/cockpit/load";
import { signupsByDay } from "@/lib/admin/traffic";
import { SIGNUPS_SINCE, dayKey, daysBetween, signupTrend, summarizeTrend, weeklyTotals } from "@/lib/admin/trafficStats";
import { requireAdminPage } from "@/lib/admin/accessCode";

// « Inscriptions jour par jour » (24/10, demande de Nathan) : tous les
// comptes créés depuis le 4 septembre 2026, un jour par ligne, pour voir
// quand ça monte, quand ça baisse et le meilleur jour. Comptes : profils
// Supabase (en cache 5 min). Uniquement des inscrits depuis le 25/10 : plus
// de colonne visiteurs (Nathan : « ne compte que les inscrits »).
export const maxDuration = 60;

const WEEKDAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const SHORT_WEEKDAYS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

/** « 2026-09-04 » → « 04/09 ». */
const ddmm = (key: string) => `${key.slice(8, 10)}/${key.slice(5, 7)}`;
const longDay = (key: string) => {
  const t = Date.parse(`${key}T12:00:00Z`);
  return new Date(t).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
};
const avg = (n: number | null) => (n === null ? "—" : n.toLocaleString("fr-FR", { maximumFractionDigits: 1 }));

export default async function SignupsPage() {
  await requireAdminPage();
  const now = nowMs();
  const todayKey = dayKey(now);

  const signupDays = await signupsByDay(new Date(SIGNUPS_SINCE).toISOString()).catch((err) => (console.error("inscriptions: lecture des profils", err), null));

  if (!signupDays) {
    return (
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 12px" }}>Inscriptions jour par jour</h1>
        <Card>
          <p style={{ margin: 0, fontSize: 14 }}>Lecture des comptes impossible pour l&apos;instant. Réessayer dans une minute.</p>
        </Card>
      </div>
    );
  }

  const days = daysBetween(SIGNUPS_SINCE, now);
  const trend = signupTrend(days, signupDays, todayKey);
  const summary = summarizeTrend(trend);
  const weeks = weeklyTotals(trend);
  const maxDay = summary.record?.signups ?? 0;
  const bestWeekday = summary.weekdayAvg.reduce<number | null>((best, v, i) => (v !== null && (best === null || v > (summary.weekdayAvg[best] ?? -1)) ? i : best), null);
  const weekDelta =
    summary.last7 !== null && summary.prev7 !== null
      ? (() => {
          const diff = summary.last7 - summary.prev7;
          const rel = summary.prev7 > 0 ? ` (${diff >= 0 ? "+" : "−"}${Math.abs(Math.round((diff / summary.prev7) * 100))} %)` : "";
          return {
            text: diff === 0 ? "= vs les 7 jours d'avant" : `${diff > 0 ? "+" : "−"}${int(Math.abs(diff))}${rel} vs les 7 jours d'avant`,
            direction: diff > 0 ? ("up" as const) : diff < 0 ? ("down" as const) : ("flat" as const),
          };
        })()
      : null;
  const vsYesterday = summary.yesterday;

  return (
    <div>
      <AutoRefresh seconds={300} />
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Inscriptions jour par jour</h1>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--color-neutral-600)" }}>
        Tous les comptes créés depuis le 4 septembre 2026, heure de Paris. Mis à jour toutes les 5 minutes, aujourd&apos;hui compris (journée en cours).
      </p>

      <KpiGrid>
        <Kpi
          hero
          accent="green"
          label="Inscrits depuis le 4 septembre"
          value={summary.total}
          sub={`sur ${days.length} jours`}
          definition="Comptes créés depuis le 4 septembre 2026 à 0 h (Paris), aujourd'hui compris. Un compte supprimé depuis n'est plus compté."
          source="Supabase, profils.created_at"
        />
        <Kpi
          accent="pink"
          href={`/admin/inscriptions/${todayKey}`}
          cta="Voir les inscrits"
          label="Aujourd'hui"
          value={summary.today}
          sub={vsYesterday === null ? undefined : `hier : ${int(vsYesterday)} (journée complète)`}
          definition="Comptes créés depuis minuit (Paris). La journée n'est pas finie : comparer à hier en fin de soirée."
          source="Supabase, profils.created_at"
        />
        <Kpi
          accent="amber"
          href={summary.record ? `/admin/inscriptions/${summary.record.key}` : undefined}
          cta="Voir ce jour-là"
          label="Record"
          value={summary.record ? summary.record.signups : <Insufficient />}
          sub={summary.record ? longDay(summary.record.key) : undefined}
          definition="Le jour avec le plus de comptes créés depuis le 4 septembre (le plus récent en cas d'égalité)."
          source="Supabase, profils.created_at"
        />
        <Kpi
          accent="blue"
          href={summary.low ? `/admin/inscriptions/${summary.low.key}` : undefined}
          cta="Voir le jour le plus bas"
          label="Moyenne par jour"
          value={avg(summary.avgPerDay)}
          sub={summary.low ? `jour le plus bas : ${int(summary.low.signups)}, ${longDay(summary.low.key)}` : undefined}
          definition="Comptes créés par jour terminé, du 4 septembre à hier (aujourd'hui exclu : journée incomplète)."
          source="Supabase, profils.created_at"
        />
        <Kpi
          accent="violet"
          label="7 derniers jours"
          value={summary.last7 === null ? <Insufficient /> : int(summary.last7)}
          delta={weekDelta}
          definition="Comptes créés les 7 derniers jours terminés (hier et les 6 jours d'avant), comparés aux 7 jours précédents."
          source="Supabase, profils.created_at"
        />
        <Kpi
          accent="green"
          label="Meilleur jour de la semaine"
          value={bestWeekday === null ? <Insufficient /> : WEEKDAYS[bestWeekday]}
          sub={bestWeekday === null ? undefined : `${avg(summary.weekdayAvg[bestWeekday])} inscrits en moyenne`}
          definition="Jour de la semaine avec la meilleure moyenne d'inscriptions, sur les jours terminés depuis le 4 septembre."
          source="Supabase, profils.created_at"
        />
      </KpiGrid>

      <Section title="Courbe" subtitle="Chaque barre est une journée (la dernière est en cours). Clique sur une barre pour voir qui s'est inscrit ce jour-là.">
        <Card title="Inscrits par jour">
          <BarChart
            times={trend.map((d) => d.t)}
            series={[{ name: "Inscrits", color: SERIES_COLORS[0], values: trend.map((d) => d.signups) }]}
            unit="count"
            height={240}
            caption="Comptes créés par jour depuis le 4 septembre"
            hrefs={trend.map((d) => `/admin/inscriptions/${d.key}`)}
          />
        </Card>
        <div className="cockpit-grid-2" style={{ marginTop: 12 }}>
          <Card title="Tendance (moyenne sur 7 jours)">
            <LineChart
              times={trend.filter((d) => d.avg7 !== null).map((d) => d.t)}
              series={[{ name: "Moyenne 7 jours", color: SERIES_COLORS[0], values: trend.filter((d) => d.avg7 !== null).map((d) => Math.round((d.avg7 ?? 0) * 10) / 10) }]}
              unit="count"
              caption="Moyenne glissante des inscriptions sur 7 jours"
            />
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--color-neutral-600)" }}>Lisse les week-ends : si elle monte, la croissance est réelle.</p>
          </Card>
          <Card title="Total cumulé">
            <LineChart
              times={trend.map((d) => d.t)}
              series={[{ name: "Inscrits cumulés", color: SERIES_COLORS[1], values: trend.map((d) => d.cumul) }]}
              unit="count"
              caption="Comptes créés cumulés depuis le 4 septembre"
            />
          </Card>
        </div>
      </Section>

      <Section title="Par semaine" subtitle="Lundi → dimanche. « Par jour » ne compte que les journées terminées : les semaines incomplètes restent comparables.">
        <Card>
          <div className="cockpit-scroll">
            <table className="cockpit-table">
              <thead>
                <tr>
                  <th>Semaine</th>
                  <th>Inscrits</th>
                  <th>Par jour</th>
                  <th>vs semaine d&apos;avant</th>
                </tr>
              </thead>
              <tbody>
                {[...weeks].reverse().map((w, i, list) => {
                  const prev = list[i + 1];
                  const diff = w.perDay === null || !prev || prev.perDay === null ? null : w.perDay - prev.perDay;
                  return (
                    <tr key={w.start}>
                      <td>
                        {ddmm(w.start)} → {ddmm(w.end)}
                        {w.current ? (
                          <span className="cockpit-pill" style={{ marginLeft: 6 }}>
                            en cours
                          </span>
                        ) : (
                          w.days < 7 && <span style={{ color: "var(--color-neutral-600)" }}> ({w.days} j)</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>{int(w.signups)}</td>
                      <td>{avg(w.perDay)}</td>
                      <td style={{ color: diff === null || Math.abs(diff) < 0.05 ? "var(--color-neutral-600)" : diff > 0 ? "#0c6b3c" : "#b42318" }}>
                        {diff === null ? "—" : Math.abs(diff) < 0.05 ? "=" : `${diff > 0 ? "▲ +" : "▼ −"}${avg(Math.abs(diff))} / jour`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>

      <Section
        title="Jour par jour"
        subtitle="Le plus récent en haut. Clique sur une date pour le détail du jour. Source n°1 : canal le plus fréquent parmi les inscrits du jour (lien suivi à l'inscription)."
      >
        <Card>
          <div className="cockpit-scroll" style={{ maxHeight: 720 }}>
            <table className="cockpit-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Inscrits</th>
                  <th>vs veille</th>
                  <th>Moy. 7 j</th>
                  <th>Cumul</th>
                  <th>Onboarding fini</th>
                  <th>Source n°1</th>
                </tr>
              </thead>
              <tbody>
                {[...trend].reverse().map((d) => {
                  const isRecord = summary.record?.key === d.key;
                  return (
                    <tr key={d.key} style={isRecord ? { background: "color-mix(in srgb, #0f9c56 10%, transparent)" } : undefined}>
                      <td>
                        <Link href={`/admin/inscriptions/${d.key}`} className="cockpit-row-link">
                          <span style={{ display: "inline-block", width: 34, color: "var(--color-neutral-600)", fontWeight: 400 }}>{SHORT_WEEKDAYS[d.weekday]}</span>
                          {ddmm(d.key)} →
                        </Link>
                        {d.isToday && <span className="cockpit-pill" style={{ marginLeft: 6 }}>en cours</span>}
                        {isRecord && <span className="cockpit-pill is-good" style={{ marginLeft: 6 }}>★ record</span>}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        <span aria-hidden style={{ display: "inline-block", width: 70, height: 8, borderRadius: 4, background: "var(--color-neutral-200)", verticalAlign: "middle", marginRight: 8 }}>
                          <span style={{ display: "block", width: `${maxDay > 0 ? Math.max(d.signups > 0 ? 3 : 0, Math.round((d.signups / maxDay) * 100)) : 0}%`, height: 8, borderRadius: 4, background: SERIES_COLORS[0] }} />
                        </span>
                        {int(d.signups)}
                      </td>
                      <td style={{ color: d.diff === null || d.diff === 0 || d.isToday ? "var(--color-neutral-600)" : d.diff > 0 ? "#0c6b3c" : "#b42318" }}>
                        {d.diff === null ? "—" : d.diff === 0 ? "=" : `${d.diff > 0 ? "▲ +" : "▼ −"}${int(Math.abs(d.diff))}`}
                      </td>
                      <td>{avg(d.avg7)}</td>
                      <td>{int(d.cumul)}</td>
                      <td>{d.signups > 0 ? `${int(d.onboarded)} (${pct(d.onboarded / d.signups, 0)})` : "—"}</td>
                      <td>{d.topSource ? `${d.topSource.label} (${int(d.topSource.count)})` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>

      <p style={{ marginTop: 24, fontSize: 12, color: "var(--color-neutral-500)", lineHeight: 1.5 }}>
        « vs veille » du jour en cours compare une journée pas finie à une journée complète. Voir aussi : <Link href="/admin/trafic">trafic et sources</Link> ·{" "}
        <Link href="/admin/cohortes">cohortes</Link> · <Link href="/admin/users">utilisateurs</Link>
      </p>
    </div>
  );
}
