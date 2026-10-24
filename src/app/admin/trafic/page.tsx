import Link from "next/link";
import { Card, Insufficient, Kpi, KpiGrid, Section } from "@/components/admin/cockpit/Kpi";
import { BarChart } from "@/components/admin/cockpit/BarChart";
import { SERIES_COLORS } from "@/components/admin/cockpit/chartUtils";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { int, pct, startOfParisDay } from "@/lib/admin/cockpit/format";
import { loadSnapshot, nowMs } from "@/lib/admin/cockpit/load";
import { getHeardFromStats, withTimeout } from "@/lib/admin/dashboardStats";
import { landingPages, onlineNow, payerIds, payerSignups, signupsByDay, visitorsByDaySource, visitorsBySource } from "@/lib/admin/traffic";
import { DAY_MS, SIGNUPS_SINCE, dayKey, daysBetween, mergeBySource, sourceInfo, totalsByGroup } from "@/lib/admin/trafficStats";
import { requireAdminPage } from "@/lib/admin/accessCode";
import { HBars } from "@/components/admin/cockpit/Visual";

// « Trafic et sources » (24/10, demande de Nathan) : combien de personnes
// sont venues aujourd'hui, combien sont en ligne, d'où elles viennent
// (TikTok, Instagram, e-mails…) et où elles décrochent entre la première
// page et le paiement. Visiteurs : site_visits ; inscrits : profils ;
// payeurs : Stripe. Données en cache 5 min, page rechargée chaque minute.
export const maxDuration = 60;

const PERIODS = [
  { days: 1, label: "Aujourd'hui" },
  { days: 7, label: "7 jours" },
  { days: 30, label: "30 jours" },
] as const;

const SQL_NOTE = "Historique des visites disponible une fois exécutée la section 5 du SQL du 24/10 (fonctions de comptage des visites).";

function Meter({ value, max }: { value: number; max: number }) {
  const w = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <span aria-hidden style={{ display: "inline-block", width: 90, height: 8, borderRadius: 4, background: "var(--color-neutral-200)", verticalAlign: "middle", marginRight: 8 }}>
      <span style={{ display: "block", width: `${w}%`, height: 8, borderRadius: 4, background: SERIES_COLORS[0] }} />
    </span>
  );
}

const rate = (num: number, den: number) => (den > 0 ? pct(num / den, 0) : "—");

export default async function TrafficPage({ searchParams }: { searchParams: Promise<{ j?: string }> }) {
  await requireAdminPage();
  const { j } = await searchParams;
  const days = PERIODS.find((p) => String(p.days) === j)?.days ?? 1;
  const periodLabel = PERIODS.find((p) => p.days === days)!.label;
  const now = nowMs();
  const todayStart = startOfParisDay(now);
  const since = todayStart - (days - 1) * DAY_MS;
  // Fin = minuit ce soir : même clé de cache toute la journée, données
  // rafraîchies toutes les 5 minutes par le cache lui-même.
  const endIso = new Date(todayStart + DAY_MS).toISOString();
  const sinceIso = new Date(since).toISOString();
  const chartDays = Math.max(days, 14);
  const chartSince = todayStart - (chartDays - 1) * DAY_MS;

  const [bySource, byDay, landing, online, signupDays, { value: payers }] = await Promise.all([
    visitorsBySource(sinceIso, endIso).catch((err) => (console.error("trafic: visiteurs par source", err), undefined)),
    visitorsByDaySource(new Date(chartSince).toISOString(), endIso).catch((err) => (console.error("trafic: visiteurs par jour", err), undefined)),
    landingPages(sinceIso, endIso).catch((err) => (console.error("trafic: pages d'arrivée", err), undefined)),
    onlineNow(now).catch(() => null),
    signupsByDay(new Date(SIGNUPS_SINCE).toISOString()).catch((err) => (console.error("trafic: inscrits", err), null)),
    withTimeout(
      loadSnapshot().then(({ snap }) => (snap ? payerSignups(payerIds(snap)) : null)),
      10_000,
      null,
    ).catch(() => ({ value: null })),
  ]);

  const heard = await withTimeout(getHeardFromStats().catch(() => null), 8000, null);
  const periodDays = new Set(daysBetween(since, now).map((d) => d.key));
  const rows = mergeBySource(bySource?.rows ?? null, signupDays ?? [], payers, periodDays);
  const groups = totalsByGroup(rows);
  const visitorsKnown = !!bySource;
  // undefined : lecture en échec ; null : historique indisponible sans le SQL.
  const visitsNote = bySource === undefined ? "Lecture des visites impossible pour l'instant." : SQL_NOTE;
  const visitors = rows.reduce((s, r) => s + r.visitors, 0);
  const signupPage = rows.reduce((s, r) => s + r.signupPage, 0);
  const periodSignups = (signupDays ?? []).filter((d) => periodDays.has(d.day));
  const signups = periodSignups.reduce((s, d) => s + d.signups, 0);
  const onboarded = periodSignups.reduce((s, d) => s + d.onboarded, 0);
  const paying = payers ? payers.filter((p) => periodDays.has(p.day)).length : null;
  const group = (name: string) => groups.find((g) => g.group === name);
  const email = group("E-mails Stageio");
  const social = group("Réseaux sociaux");
  const bySocial = rows.filter((r) => r.group === "Réseaux sociaux" && r.visitors > 0).slice(0, 3);

  // Graphiques : visiteurs par jour en trois familles (palette de 3
  // couleurs, jamais plus), inscrits par jour à part (pas de double axe).
  const chartKeys = daysBetween(chartSince, now);
  const dayFamily = new Map<string, [number, number, number]>();
  for (const r of byDay?.rows ?? []) {
    const g = sourceInfo(r.source).group;
    const cur = dayFamily.get(r.day) ?? [0, 0, 0];
    cur[g === "Réseaux sociaux" ? 0 : g === "E-mails Stageio" ? 1 : 2] += r.visitors;
    dayFamily.set(r.day, cur);
  }
  const signupsOn = new Map((signupDays ?? []).map((d) => [d.day, d.signups]));
  const maxVisitors = Math.max(0, ...rows.map((r) => r.visitors));

  const funnel = [
    { label: "Visiteurs", value: visitorsKnown ? visitors : null, def: "Personnes distinctes (un navigateur = une personne) qui ont ouvert au moins une page." },
    { label: "Ont ouvert la page d'inscription", value: visitorsKnown ? signupPage : null, def: "Parmi les visiteurs, ceux qui ont ouvert /inscription." },
    { label: "Comptes créés", value: signupDays ? signups : null, def: "Comptes créés sur la période (tous, même venus d'une visite plus ancienne)." },
    { label: "Onboarding terminé", value: signupDays ? onboarded : null, def: "Parmi ces comptes, ceux qui ont fini le questionnaire de départ." },
    { label: "Payants", value: paying, def: "Parmi ces comptes, ceux qui ont payé (abonnement ou accès à vie), à ce jour, d'après Stripe." },
  ];
  const funnelTop = funnel[0].value ?? funnel[2].value ?? 0;

  return (
    <div>
      <AutoRefresh seconds={60} />
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Trafic et sources</h1>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--color-neutral-600)" }}>
        Qui vient, d&apos;où, et jusqu&apos;où ils vont. {periodLabel}
        {days > 1 ? " (aujourd'hui compris)" : ""}, heure de Paris. Mis à jour toutes les 5 minutes ; « en ligne » à la minute.
      </p>
      <div className="seg" role="group" aria-label="Période">
        {PERIODS.map((p) => (
          <Link key={p.days} href={`/admin/trafic?j=${p.days}`} className={`seg-opt${p.days === days ? " is-active" : ""}`} style={{ padding: "7px 14px", fontSize: 13 }}>
            {p.label}
          </Link>
        ))}
      </div>

      <Section title={days === 1 ? "Aujourd'hui" : periodLabel}>
        <KpiGrid>
          <Kpi
            hero
            accent="green"
            href="#sources"
            cta="Par source"
            label={days === 1 ? "Visiteurs aujourd'hui" : "Visiteurs"}
            value={visitorsKnown ? visitors : <Insufficient>{bySource === undefined ? "Indisponible" : "SQL à exécuter"}</Insufficient>}
            sub={visitorsKnown ? `${int(signupPage)} ont ouvert la page d'inscription` : visitsNote}
            definition="Personnes distinctes (un cookie anonyme par navigateur) qui ont ouvert au moins une page du site, robots et aperçus de liens exclus. Une même personne sur son téléphone puis son ordinateur compte deux fois."
            source="Supabase, site_visits"
          />
          <Kpi
            live
            accent="blue"
            href="/admin/online"
            cta="Voir qui"
            label="En ligne maintenant"
            value={online ? online.visitors : <Insufficient />}
            sub={online ? `dont ${int(online.loggedIn)} connecté${online.loggedIn > 1 ? "s" : ""} à leur compte` : undefined}
            definition="Visiteurs qui ont ouvert une page dans les 5 dernières minutes, avec ou sans compte. « Connectés » : comptes actifs dans l'appli dans les 3 dernières minutes (signal envoyé toutes les 30 s)."
            source="Supabase, site_visits et profils.last_active_at"
          />
          <Kpi
            accent="pink"
            href={days === 1 ? `/admin/inscriptions/${dayKey(now)}` : "/admin/inscriptions"}
            cta="Voir les inscrits"
            label={days === 1 ? "Inscrits aujourd'hui" : "Inscrits"}
            value={signupDays ? signups : <Insufficient />}
            sub={signupDays ? `${int(onboarded)} ont fini l'onboarding` : undefined}
            definition="Comptes créés sur la période (minuit heure de Paris)."
            source="Supabase, profils.created_at"
          />
          <Kpi
            accent="amber"
            href="#flux"
            cta="Voir le flux"
            label="Visite → inscription"
            value={visitorsKnown && signupDays ? rate(signups, visitors) : <Insufficient />}
            definition="Comptes créés / visiteurs de la période. Repère : 30-40 % sur un trafic qualifié (cible 50 %). Un compte créé aujourd'hui par quelqu'un venu hier compte dans les inscrits mais pas dans les visiteurs du jour."
            source="Supabase"
          />
          <Kpi
            accent="violet"
            href="/admin/trafic/source/email"
            label="Venus d'un e-mail"
            value={visitorsKnown ? (email?.visitors ?? 0) : <Insufficient />}
            definition="Visiteurs arrivés par un lien d'un e-mail Stageio (série, alertes d'offres, relances : liens marqués utm_source=email). Surtout des inscrits qui reviennent."
            source="Supabase, site_visits"
          />
          <Kpi
            accent="pink"
            href={`/admin/trafic/source/${bySocial[0]?.key ?? "tiktok"}`}
            cta={`Détail ${bySocial[0]?.label ?? "TikTok"}`}
            label="Venus des réseaux sociaux"
            value={visitorsKnown ? (social?.visitors ?? 0) : <Insufficient />}
            sub={bySocial.length > 0 ? bySocial.map((r) => `${r.label} ${int(r.visitors)}`).join(" · ") : visitorsKnown ? "aucun pour l'instant" : undefined}
            definition="Visiteurs arrivés de TikTok, Instagram, Snapchat, YouTube, Facebook, LinkedIn, X, Reddit ou WhatsApp : lien marqué (utm_source, ?a=) ou site d'origine. Les applis qui masquent leur origine (souvent TikTok et Instagram sans lien marqué) tombent dans « Direct / inconnu »."
            source="Supabase, site_visits"
          />
        </KpiGrid>
      </Section>

      <div id="sources" style={{ scrollMarginTop: 16 }} />
      <Section
        title="D'où ils viennent"
        subtitle="Chaque visiteur est compté une fois, sous la première source connue de la période. Inscrits et payants : source enregistrée à l'inscription (le premier lien suivi dans les 30 jours)."
      >
        <div className="cockpit-grid-2">
          <Card title="Par canal">
            {groups.length === 0 ? (
              <Insufficient>{visitorsKnown ? "Aucune visite sur la période" : visitsNote}</Insufficient>
            ) : (
              <div className="cockpit-scroll">
                <table className="cockpit-table">
                  <thead>
                    <tr>
                      <th>Canal</th>
                      <th>Visiteurs</th>
                      <th>Inscrits</th>
                      <th>Visite → inscrit</th>
                      <th>Payants</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((g) => (
                      <tr key={g.group}>
                        <td style={{ fontWeight: 600 }}>{g.group}</td>
                        <td>
                          <Meter value={g.visitors} max={groups[0].visitors} />
                          {visitorsKnown ? int(g.visitors) : "—"}
                        </td>
                        <td>{int(g.signups)}</td>
                        <td>{visitorsKnown ? rate(g.signups, g.visitors) : "—"}</td>
                        <td>{g.payers === null ? "—" : int(g.payers)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          <Card title="Le flux, de la visite au paiement">
            <div id="flux" style={{ scrollMarginTop: 16 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {funnel.map((step, i) => {
                const prev = funnel[i - 1]?.value ?? null;
                return (
                  <div key={step.label} title={step.def}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13 }}>
                      <span style={{ fontWeight: 600 }}>{step.label}</span>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>
                        {step.value === null ? "—" : int(step.value)}
                        {i > 0 && step.value !== null && !!prev && (
                          <span style={{ color: "var(--color-neutral-600)", marginLeft: 6 }}>({rate(step.value, prev)} de l&apos;étape d&apos;avant)</span>
                        )}
                      </span>
                    </div>
                    <div style={{ height: 10, borderRadius: 4, background: "var(--color-neutral-200)", marginTop: 4 }}>
                      <div
                        style={{
                          width: `${step.value !== null && funnelTop > 0 ? Math.max(1, Math.min(100, (step.value / funnelTop) * 100)) : 0}%`,
                          height: 10,
                          borderRadius: 4,
                          background: SERIES_COLORS[0],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              <p style={{ margin: 0, fontSize: 11.5, color: "var(--color-neutral-600)", lineHeight: 1.45 }}>
                Survoler une étape pour sa définition. Détail du paywall et du paiement : « Conversion et paywall ».
              </p>
            </div>
          </Card>
        </div>

        <div style={{ marginTop: 12 }}>
          <Card title="Par source">
            {rows.length === 0 ? (
              <Insufficient>{visitorsKnown ? "Aucune visite sur la période" : visitsNote}</Insufficient>
            ) : (
              <div className="cockpit-scroll">
                <table className="cockpit-table">
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Canal</th>
                      <th>Visiteurs</th>
                      <th>Page d&apos;inscription</th>
                      <th>Inscrits</th>
                      <th>Visite → inscrit</th>
                      <th>Payants</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.label}>
                        <td>
                          <Link href={`/admin/trafic/source/${encodeURIComponent(r.key)}`} className="cockpit-row-link">
                            {r.label} →
                          </Link>
                        </td>
                        <td style={{ color: "var(--color-neutral-600)" }}>{r.group}</td>
                        <td>
                          <Meter value={r.visitors} max={maxVisitors} />
                          {visitorsKnown ? int(r.visitors) : "—"}
                        </td>
                        <td>{visitorsKnown ? int(r.signupPage) : "—"}</td>
                        <td>{int(r.signups)}</td>
                        <td>{visitorsKnown ? rate(r.signups, r.visitors) : "—"}</td>
                        <td>{r.payers === null ? "—" : int(r.payers)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {bySource && !bySource.viaSql && (
              <p style={{ margin: "8px 0 0", fontSize: 11.5, color: "var(--color-neutral-600)" }}>
                Compté ligne par ligne en attendant le SQL du 24/10 (aujourd&apos;hui et hier seulement).
              </p>
            )}
          </Card>
        </div>
      </Section>

      <Section title="Jour par jour" subtitle={`${chartDays} derniers jours. Clique sur un jour pour voir qui s'est inscrit ce jour-là.`}>
        <div className="cockpit-grid-2">
          <Card title="Visiteurs par jour">
            {byDay ? (
              <BarChart
                times={chartKeys.map((d) => d.t)}
                series={[
                  { name: "Réseaux sociaux", color: SERIES_COLORS[0], values: chartKeys.map((d) => dayFamily.get(d.key)?.[0] ?? 0) },
                  { name: "E-mails Stageio", color: SERIES_COLORS[1], values: chartKeys.map((d) => dayFamily.get(d.key)?.[1] ?? 0) },
                  { name: "Autres (Google, IA, direct…)", color: SERIES_COLORS[2], values: chartKeys.map((d) => dayFamily.get(d.key)?.[2] ?? 0) },
                ]}
                unit="count"
                caption="Visiteurs distincts par jour et par famille de sources"
                hrefs={chartKeys.map((d) => `/admin/inscriptions/${d.key}`)}
              />
            ) : (
              <Insufficient>{byDay === undefined ? "Lecture des visites impossible pour l'instant." : SQL_NOTE}</Insufficient>
            )}
          </Card>
          <Card title="Inscrits par jour">
            {signupDays ? (
              <BarChart
                times={chartKeys.map((d) => d.t)}
                series={[{ name: "Inscrits", color: SERIES_COLORS[0], values: chartKeys.map((d) => signupsOn.get(d.key) ?? 0) }]}
                unit="count"
                caption="Comptes créés par jour"
                hrefs={chartKeys.map((d) => `/admin/inscriptions/${d.key}`)}
              />
            ) : (
              <Insufficient />
            )}
            <p style={{ margin: "8px 0 0", fontSize: 12 }}>
              <Link href="/admin/inscriptions">Toutes les inscriptions depuis le 4 septembre →</Link>
            </p>
          </Card>
        </div>
      </Section>

      <Section
        title="Ce qu'ils disent : « Tu nous as connus comment ? »"
        subtitle="Réponses des inscrits des 30 derniers jours à l'onboarding, avec ce qu'ils ont payé depuis. Depuis le 25/10, les réseaux sont précisés : commentaire, vidéo, carrousel, story de quelqu'un. De quoi voir ce qui rapporte vraiment."
      >
        <Card>
          {heard.value === null ? (
            <Insufficient>Lecture impossible pour l&apos;instant.</Insufficient>
          ) : heard.value.rows.length === 0 ? (
            <Insufficient>Pas encore de réponse.</Insufficient>
          ) : (
            <>
              <HBars
                items={heard.value.rows.map((r) => ({
                  label: r.source,
                  value: r.answers,
                  note: `${r.payers} payant${r.payers > 1 ? "s" : ""} · ${(r.cents / 100).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} € · ${(r.cents / 100 / Math.max(1, r.answers)).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €/inscrit`,
                }))}
                color="#7c5cd6"
              />
              <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--color-neutral-600)" }}>
                {int(heard.value.answered)} réponses sur {int(heard.value.signups)} inscrits. « €/inscrit » : ce que rapporte en moyenne un inscrit de cette réponse, à comparer entre formats.
              </p>
            </>
          )}
        </Card>
      </Section>

      <Section title="Pages d'arrivée" subtitle="Première page ouverte par chaque visiteur sur la période.">
        <Card>
          {landing === null || landing === undefined ? (
            <Insufficient>{landing === null ? SQL_NOTE : "Lecture impossible pour l'instant"}</Insufficient>
          ) : landing.length === 0 ? (
            <Insufficient>Aucune visite sur la période</Insufficient>
          ) : (
            <div className="cockpit-scroll">
              <table className="cockpit-table">
                <thead>
                  <tr>
                    <th>Page</th>
                    <th>Visiteurs</th>
                    <th>Part</th>
                  </tr>
                </thead>
                <tbody>
                  {landing.map((l) => (
                    <tr key={l.path}>
                      <td style={{ maxWidth: 420, overflow: "hidden", textOverflow: "ellipsis" }}>{l.path}</td>
                      <td>{int(l.visitors)}</td>
                      <td>{visitorsKnown ? rate(l.visitors, visitors) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </Section>

      <p style={{ marginTop: 24, fontSize: 12, color: "var(--color-neutral-500)", lineHeight: 1.5 }}>
        Visites fiables depuis le 08/10 (avant, les préchargements de liens comptaient comme des visites). Jour en cours : {dayKey(now).split("-").reverse().join("/")}.
        Voir aussi : <Link href="/admin/inscriptions">inscriptions jour par jour</Link> · <Link href="/admin/online">en ligne</Link> ·{" "}
        <Link href="/admin/acquisition">conversion et paywall</Link> · <Link href="/admin/emails">e-mails</Link>
      </p>
    </div>
  );
}
