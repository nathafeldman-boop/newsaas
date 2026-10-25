import Link from "next/link";
import { Card, Insufficient, Kpi, KpiGrid, Section } from "@/components/admin/cockpit/Kpi";
import { BarChart } from "@/components/admin/cockpit/BarChart";
import { SERIES_COLORS } from "@/components/admin/cockpit/chartUtils";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { int, pct, startOfParisDay } from "@/lib/admin/cockpit/format";
import { loadSnapshot, nowMs } from "@/lib/admin/cockpit/load";
import { getHeardFromStats, withTimeout } from "@/lib/admin/dashboardStats";
import { deckFeedback, onlineNow, payerIds, payerSignups, signupFunnel, signupsByDay } from "@/lib/admin/traffic";
import { PASS_REASONS, isPassReason } from "@/lib/matching/passReasons";
import { DAY_MS, SIGNUPS_SINCE, dayKey, daysBetween, mergeBySource, sourceInfo, totalsByGroup } from "@/lib/admin/trafficStats";
import { requireAdminPage } from "@/lib/admin/accessCode";
import { HBars } from "@/components/admin/cockpit/Visual";

// « Trafic et sources » (24/10, demande de Nathan) : combien de personnes
// arrivent, combien sont en ligne, d'où elles viennent (TikTok, Instagram,
// Google…) et où elles décrochent avant le paiement. Depuis le 25/10,
// uniquement des inscrits (Nathan : « les visiteurs, ça peut être des robots
// Google ; ne compte que les inscrits ») : profils, événements du parcours,
// payeurs Stripe. Données en cache 5 à 10 min, page rechargée chaque minute.
export const maxDuration = 60;

const PERIODS = [
  { days: 1, label: "Aujourd'hui" },
  { days: 7, label: "7 jours" },
  { days: 30, label: "30 jours" },
] as const;

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
  const sinceIso = new Date(since).toISOString();
  const chartDays = Math.max(days, 14);
  const chartSince = todayStart - (chartDays - 1) * DAY_MS;

  const [online, signupDays, funnelData, { value: payers }] = await Promise.all([
    onlineNow(now, todayStart).catch(() => null),
    signupsByDay(new Date(SIGNUPS_SINCE).toISOString()).catch((err) => (console.error("trafic: inscrits", err), null)),
    signupFunnel(sinceIso).catch((err) => (console.error("trafic: flux des inscrits", err), null)),
    withTimeout(
      loadSnapshot().then(({ snap }) => (snap ? payerSignups(payerIds(snap)) : null)),
      10_000,
      null,
    ).catch(() => ({ value: null })),
  ]);

  const [heard, feedback] = await Promise.all([
    withTimeout(getHeardFromStats().catch(() => null), 8000, null),
    deckFeedback(sinceIso).catch((err) => (console.error("trafic: pertinence du paquet", err), null)),
  ]);
  const swipes = feedback ? feedback.likes + feedback.passes : 0;
  const reasonsTotal = feedback ? feedback.reasons.reduce((s, r) => s + r.count, 0) : 0;
  const periodDays = new Set(daysBetween(since, now).map((d) => d.key));
  const rows = mergeBySource(null, signupDays ?? [], payers, periodDays)
    .filter((r) => r.signups > 0 || (r.payers ?? 0) > 0)
    .sort((a, b) => b.signups - a.signups || a.label.localeCompare(b.label));
  const groups = totalsByGroup(rows).sort((a, b) => b.signups - a.signups);
  const periodSignups = (signupDays ?? []).filter((d) => periodDays.has(d.day));
  const signups = periodSignups.reduce((s, d) => s + d.signups, 0);
  const onboarded = periodSignups.reduce((s, d) => s + d.onboarded, 0);
  const paying = payers ? payers.filter((p) => periodDays.has(p.day)).length : null;
  const top = (group: string[]) => rows.filter((r) => group.includes(r.group) && r.signups > 0);
  const social = top(["Réseaux sociaux"]);
  const search = top(["Moteurs de recherche", "Assistants IA"]);
  const sum = (list: typeof rows) => list.reduce((s, r) => s + r.signups, 0);
  const maxSignups = Math.max(0, ...rows.map((r) => r.signups));

  // Graphique : inscrits par jour en trois familles de sources (palette de
  // 3 couleurs, jamais plus).
  const chartKeys = daysBetween(chartSince, now);
  const familyOf = (source: string) => {
    const g = sourceInfo(source).group;
    return g === "Réseaux sociaux" ? 0 : g === "Direct / inconnu" ? 1 : 2;
  };
  const dayFamily = new Map<string, [number, number, number]>();
  for (const d of signupDays ?? []) {
    const cur: [number, number, number] = [0, 0, 0];
    for (const [source, n] of Object.entries(d.sources)) cur[familyOf(source)] += n;
    dayFamily.set(d.day, cur);
  }

  const funnel = [
    { label: "Comptes créés", value: funnelData?.signups ?? null, def: "Comptes créés sur la période (heure de Paris)." },
    { label: "Onboarding terminé", value: funnelData?.onboarded ?? null, def: "Parmi ces comptes, ceux qui ont fini le questionnaire de départ." },
    { label: "Paywall vu", value: funnelData?.paywallViewed ?? null, def: "Parmi ces comptes, ceux qui ont vu la page Premium." },
    { label: "Paiement ouvert", value: funnelData?.checkoutOpened ?? null, def: "Parmi ces comptes, ceux qui ont ouvert la page de paiement Stripe." },
    { label: "Payants", value: paying, def: "Parmi ces comptes, ceux qui ont payé (abonnement ou accès à vie), à ce jour, d'après Stripe." },
  ];
  const funnelTop = funnel[0].value ?? 0;

  return (
    <div>
      <AutoRefresh seconds={60} />
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Trafic et sources</h1>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--color-neutral-600)" }}>
        Qui s&apos;inscrit, d&apos;où, et jusqu&apos;où ils vont. Uniquement des inscrits : les visiteurs sans compte (robots compris) ne sont pas comptés. {periodLabel}
        {days > 1 ? " (aujourd'hui compris)" : ""}, heure de Paris. Mis à jour toutes les 5 minutes ; « inscrits en ligne » à la minute.
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
            href={days === 1 ? `/admin/inscriptions/${dayKey(now)}` : "/admin/inscriptions"}
            cta="Voir les inscrits"
            label={days === 1 ? "Inscrits aujourd'hui" : "Inscrits"}
            value={signupDays ? signups : <Insufficient />}
            sub={signupDays ? `${int(onboarded)} ont fini l'onboarding (${rate(onboarded, signups)})` : undefined}
            definition="Comptes créés sur la période (minuit heure de Paris)."
            source="Supabase, profils.created_at"
          />
          <Kpi
            live
            accent="blue"
            href="/admin/online"
            cta="Voir qui"
            label="Inscrits en ligne"
            value={online ? online.accounts : <Insufficient />}
            sub={online ? `${int(online.activeToday)} inscrits actifs aujourd'hui` : undefined}
            definition="Comptes actifs dans l'appli dans les 3 dernières minutes (signal envoyé toutes les 45 s par chaque page ouverte). Visiteurs sans compte et robots exclus."
            source="Supabase, profils.last_active_at"
          />
          <Kpi
            accent="amber"
            href="#flux"
            cta="Voir le flux"
            label="Inscription → payant"
            value={signupDays && paying !== null ? rate(paying, signups) : <Insufficient />}
            sub={paying !== null ? `${int(paying)} payant${paying > 1 ? "s" : ""}` : undefined}
            definition="Part des inscrits de la période qui ont payé (abonnement ou accès à vie), à ce jour, d'après Stripe. Les inscrits les plus récents ont eu moins de temps pour payer."
            source="Supabase (inscrits) + Stripe (payeurs)"
          />
          <Kpi
            accent="pink"
            href={`/admin/trafic/source/${social[0]?.key ?? "tiktok"}`}
            cta={`Détail ${social[0]?.label ?? "TikTok"}`}
            label="Venus des réseaux sociaux"
            value={signupDays ? sum(social) : <Insufficient />}
            sub={social.length > 0 ? social.slice(0, 3).map((r) => `${r.label} ${int(r.signups)}`).join(" · ") : signupDays ? "aucun pour l'instant" : undefined}
            definition="Inscrits arrivés de TikTok, Instagram, Snapchat, YouTube, Facebook, LinkedIn, X, Reddit ou WhatsApp : lien marqué (utm_source, ?a=) ou site d'origine, enregistré à l'inscription. Les applis qui masquent leur origine (souvent TikTok et Instagram sans lien marqué) tombent dans « Direct / inconnu »."
            source="Supabase, profils.utm_source"
          />
          <Kpi
            accent="violet"
            href={`/admin/trafic/source/${search[0]?.key ?? "google"}`}
            cta={`Détail ${search[0]?.label ?? "Google"}`}
            label="Venus de Google et des IA"
            value={signupDays ? sum(search) : <Insufficient />}
            sub={search.length > 0 ? search.slice(0, 3).map((r) => `${r.label} ${int(r.signups)}`).join(" · ") : signupDays ? "aucun pour l'instant" : undefined}
            definition="Inscrits arrivés d'un moteur de recherche (Google, Bing…) ou d'un assistant IA (ChatGPT, Perplexity, Gemini…), d'après la source enregistrée à l'inscription."
            source="Supabase, profils.utm_source"
          />
        </KpiGrid>
      </Section>

      <div id="sources" style={{ scrollMarginTop: 16 }} />
      <Section title="D'où viennent les inscrits" subtitle="Source enregistrée à l'inscription (le premier lien suivi dans les 30 jours). Payants : parmi ces inscrits, à ce jour, d'après Stripe.">
        <div className="cockpit-grid-2">
          <Card title="Par canal">
            {!signupDays ? (
              <Insufficient>Lecture impossible pour l&apos;instant</Insufficient>
            ) : groups.length === 0 ? (
              <Insufficient>Aucun inscrit sur la période</Insufficient>
            ) : (
              <div className="cockpit-scroll">
                <table className="cockpit-table">
                  <thead>
                    <tr>
                      <th>Canal</th>
                      <th>Inscrits</th>
                      <th>Part</th>
                      <th>Payants</th>
                      <th>Inscrit → payant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((g) => (
                      <tr key={g.group}>
                        <td style={{ fontWeight: 600 }}>{g.group}</td>
                        <td>
                          <Meter value={g.signups} max={groups[0].signups} />
                          {int(g.signups)}
                        </td>
                        <td>{rate(g.signups, signups)}</td>
                        <td>{g.payers === null ? "—" : int(g.payers)}</td>
                        <td>{g.payers === null ? "—" : rate(g.payers, g.signups)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          <Card title="Le flux, de l'inscription au paiement">
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
            {!signupDays ? (
              <Insufficient>Lecture impossible pour l&apos;instant</Insufficient>
            ) : rows.length === 0 ? (
              <Insufficient>Aucun inscrit sur la période</Insufficient>
            ) : (
              <div className="cockpit-scroll">
                <table className="cockpit-table">
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Canal</th>
                      <th>Inscrits</th>
                      <th>Part</th>
                      <th>Payants</th>
                      <th>Inscrit → payant</th>
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
                          <Meter value={r.signups} max={maxSignups} />
                          {int(r.signups)}
                        </td>
                        <td>{rate(r.signups, signups)}</td>
                        <td>{r.payers === null ? "—" : int(r.payers)}</td>
                        <td>{r.payers === null ? "—" : rate(r.payers, r.signups)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </Section>

      <Section title="Jour par jour" subtitle={`${chartDays} derniers jours. Clique sur un jour pour voir qui s'est inscrit ce jour-là.`}>
        <Card title="Inscrits par jour, par famille de sources">
          {signupDays ? (
            <BarChart
              times={chartKeys.map((d) => d.t)}
              series={[
                { name: "Réseaux sociaux", color: SERIES_COLORS[0], values: chartKeys.map((d) => dayFamily.get(d.key)?.[0] ?? 0) },
                { name: "Direct / inconnu", color: SERIES_COLORS[1], values: chartKeys.map((d) => dayFamily.get(d.key)?.[1] ?? 0) },
                { name: "Autres (Google, IA, partages…)", color: SERIES_COLORS[2], values: chartKeys.map((d) => dayFamily.get(d.key)?.[2] ?? 0) },
              ]}
              unit="count"
              caption="Comptes créés par jour et par famille de sources"
              hrefs={chartKeys.map((d) => `/admin/inscriptions/${d.key}`)}
            />
          ) : (
            <Insufficient />
          )}
          <p style={{ margin: "8px 0 0", fontSize: 12 }}>
            <Link href="/admin/inscriptions">Toutes les inscriptions depuis le 4 septembre →</Link>
          </p>
        </Card>
      </Section>

      <Section
        title="Pertinence du paquet d'offres"
        subtitle="Combien d'offres les étudiants likent, et pourquoi ils passent les autres (« Pas pour toi ? », depuis le 25/10). Si « Trop loin » ou « Pas mon métier » domine, c'est là qu'il faut agir."
      >
        <div className="cockpit-grid-2">
          <KpiGrid>
            <Kpi
              accent="green"
              label="Taux de like"
              value={feedback && swipes > 0 ? rate(feedback.likes, swipes) : <Insufficient />}
              sub={feedback ? `${int(feedback.likes)} likes · ${int(feedback.passes)} passés` : undefined}
              definition="Likes / (likes + passes) sur la période, tous comptes confondus. Les comptes gratuits ne peuvent pas liker (le cœur mène à Premium) : le taux reflète surtout les Premium."
              source="Supabase, swipes"
            />
            <Kpi
              accent="violet"
              label="Raisons données"
              value={feedback ? reasonsTotal : <Insufficient />}
              sub={feedback && feedback.passes > 0 ? `${rate(reasonsTotal, feedback.passes)} des passes` : undefined}
              definition="Nombre de fois où un étudiant a dit pourquoi il passait une offre (barre « Pas pour toi ? » après un passer)."
              source="Supabase, user_events pass_reason"
            />
          </KpiGrid>
          <Card title="Pourquoi ils passent">
            {feedback ? (
              <HBars
                items={feedback.reasons.map((r) => ({ label: isPassReason(r.reason) ? `${PASS_REASONS[r.reason].icon} ${PASS_REASONS[r.reason].label}` : r.reason, value: r.count }))}
                color="#e87ba4"
                empty="Pas encore de raison donnée."
              />
            ) : (
              <Insufficient />
            )}
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

      <p style={{ marginTop: 24, fontSize: 12, color: "var(--color-neutral-500)", lineHeight: 1.5 }}>
        Jour en cours : {dayKey(now).split("-").reverse().join("/")}.
        Voir aussi : <Link href="/admin/inscriptions">inscriptions jour par jour</Link> · <Link href="/admin/online">en ligne</Link> ·{" "}
        <Link href="/admin/acquisition">conversion et paywall</Link> · <Link href="/admin/emails">e-mails</Link>
      </p>
    </div>
  );
}
