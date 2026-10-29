import Link from "next/link";
import { Card, Kpi, KpiGrid, Section } from "@/components/admin/cockpit/Kpi";
import { requireAdminPage } from "@/lib/admin/accessCode";
import { dateTime, int, pct } from "@/lib/admin/cockpit/format";
import { loadSnapshot, nowMs } from "@/lib/admin/cockpit/load";
import { firstPaidBySub, paidSubs } from "@/lib/admin/cockpit/metrics";
import { createAdminClient } from "@/lib/supabase/admin";
import { OFFER_REPORT_EVENT } from "@/lib/offers/reports";
import { SATISFACTION_EVENT, SCORE_LABELS, SURVEY_MOMENTS, satisfactionSummary, type SatisfactionVote, type SurveyMoment } from "@/lib/satisfaction/survey";
import { cancelReasons, earlyCancellations } from "@/lib/satisfaction/stats";

// Satisfaction des abonnés (29/10, Nathan : « bosse sur la satisfaction
// client »). Trois sources, toutes réelles : la question « Stageio t'aide
// dans ta recherche ? » du tableau de bord, les résiliations Stripe (délai,
// motif, commentaire) et les offres signalées « plus disponibles ».
export const maxDuration = 60;

const DAY = 86_400_000;
const FACES = ["", "😞", "😕", "😐", "🙂", "🤩"];
const muted = { color: "var(--color-neutral-600)" } as const;

type EventRow = { user_id: string; created_at: string; event_type: string; metadata: Record<string, unknown> | null };

export default async function SatisfactionPage() {
  await requireAdminPage();
  const now = nowMs();
  const since = new Date(now - 90 * DAY).toISOString();
  const [{ snap, error }, events] = await Promise.all([
    loadSnapshot(),
    createAdminClient()
      .from("user_events")
      .select("user_id, created_at, event_type, metadata")
      .in("event_type", [SATISFACTION_EVENT, OFFER_REPORT_EVENT])
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000)
      .then(({ data, error: e }) => (e ? null : ((data ?? []) as EventRow[]))),
  ]);

  const votes: SatisfactionVote[] = (events ?? [])
    .filter((e) => e.event_type === SATISFACTION_EVENT && typeof e.metadata?.score === "number")
    .map((e) => ({
      at: Date.parse(e.created_at),
      score: e.metadata!.score as number,
      comment: typeof e.metadata!.comment === "string" ? (e.metadata!.comment as string) : null,
      moment: typeof e.metadata!.moment === "string" ? (e.metadata!.moment as string) : null,
      userId: e.user_id,
    }));
  const recent = votes.filter((v) => v.at >= now - 30 * DAY);
  const sum30 = satisfactionSummary(recent);
  const sumAll = satisfactionSummary(votes);
  const reports = (events ?? []).filter((e) => e.event_type === OFFER_REPORT_EVENT);
  const reports30 = reports.filter((e) => Date.parse(e.created_at) >= now - 30 * DAY);
  const removed30 = reports30.filter((e) => e.metadata?.removed === true).length;
  const bySource = new Map<string, number>();
  for (const r of reports30) {
    const key = String(r.metadata?.host ?? r.metadata?.source ?? "inconnu");
    bySource.set(key, (bySource.get(key) ?? 0) + 1);
  }

  const subs = snap ? paidSubs(snap, firstPaidBySub(snap.invoices)) : [];
  const window60 = { start: now - 60 * DAY, end: now };
  const early = earlyCancellations(subs, window60);
  const reasons = cancelReasons(subs, window60);

  return (
    <div>
      <h1 style={{ fontSize: 24, margin: 0 }}>Satisfaction</h1>
      <p style={{ fontSize: 13.5, margin: "6px 0 0", maxWidth: "80ch", ...muted }}>
        Ce que les abonnés disent (question « Stageio t&apos;aide dans ta recherche ? » du tableau de bord), ce que leurs résiliations montrent
        (Stripe) et les offres qu&apos;ils signalent comme plus disponibles. Une note de 1 ou 2 t&apos;est envoyée par email : réponds-y vite.
      </p>

      <div style={{ marginTop: 16 }}>
        <KpiGrid>
          <Kpi
            hero
            accent="green"
            label="Abonnés satisfaits (30 j)"
            value={sum30.n > 0 ? pct(sum30.csat, 0) : "—"}
            sub={sum30.n > 0 ? `${int(sum30.n)} réponse(s) · moyenne ${sum30.average!.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}/5` : "Pas encore de réponse"}
            definition="Part des notes 4 et 5 (« Oui », « Carrément ») à la question du tableau de bord, posée peu après le paiement, puis vers J+14 et J+30."
            source="Supabase, user_events satisfaction_vote"
          />
          <Kpi
            accent="pink"
            label="Mécontents (30 j)"
            value={int(sum30.counts[0] + sum30.counts[1])}
            sub="Notes 1 et 2, chacune envoyée par email"
            goodWhen="down"
            definition="Abonnés qui ont répondu « Pas du tout » ou « Pas vraiment ». Chaque réponse part par email aux admins (répondre à l'email écrit à l'abonné)."
            source="Supabase, user_events satisfaction_vote"
          />
          <Kpi
            accent="amber"
            label="Résiliés en moins de 24 h (60 j)"
            value={early.started > 0 ? pct(early.day1 / early.started, 0) : "—"}
            sub={`${int(early.day1)} sur ${int(early.started)} abonnés · ${int(early.day7)} en moins de 7 jours`}
            goodWhen="down"
            definition="Parmi les abonnements mensuels payés commencés ces 60 derniers jours, part dont la résiliation a été demandée moins de 24 h après le début : le signe que la première utilisation a déçu."
            source="Stripe, canceled_at et start_date"
          />
          <Kpi
            accent="violet"
            label="Offres signalées (30 j)"
            value={int(reports30.length)}
            sub={`${int(removed30)} retirée(s) après vérification`}
            definition="Offres signalées « le lien ne marche pas / plus disponible » depuis la page de candidature. Retirées quand la source le confirme ou que plusieurs étudiants la signalent."
            source="Supabase, user_events offer_reported_unavailable"
          />
        </KpiGrid>
      </div>

      <Section title="« Stageio t'aide dans ta recherche ? »" subtitle={`Toutes les réponses des 90 derniers jours (${int(sumAll.n)}).`}>
        <Card>
          {sumAll.n === 0 ? (
            <p style={{ margin: 0, fontSize: 13.5 }}>Pas encore de réponse : la question apparaît dans le tableau de bord des abonnés 2 h après leur paiement.</p>
          ) : (
            <div style={{ display: "grid", gap: 6 }}>
              {[5, 4, 3, 2, 1].map((s) => {
                const n = sumAll.counts[s - 1];
                return (
                  <div key={s} style={{ display: "grid", gridTemplateColumns: "150px 1fr 40px", alignItems: "center", gap: 10, fontSize: 13 }}>
                    <span>
                      {FACES[s]} {s} · {SCORE_LABELS[s]}
                    </span>
                    <span style={{ height: 10, borderRadius: 999, background: "var(--color-surface)", overflow: "hidden" }}>
                      <span style={{ display: "block", height: "100%", width: `${(n / sumAll.n) * 100}%`, background: s >= 4 ? "#0f9c56" : s === 3 ? "#d98a00" : "#c2262b", borderRadius: 999 }} />
                    </span>
                    <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{int(n)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
        {votes.some((v) => v.comment) && (
          <div className="cockpit-card" style={{ marginTop: 12, overflowX: "auto" }}>
            <table className="cockpit-table" style={{ width: "100%", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Date</th>
                  <th>Note</th>
                  <th style={{ textAlign: "left" }}>Moment</th>
                  <th style={{ textAlign: "left" }}>Commentaire</th>
                  <th>Fiche</th>
                </tr>
              </thead>
              <tbody>
                {votes
                  .filter((v) => v.comment)
                  .slice(0, 50)
                  .map((v) => (
                    <tr key={`${v.userId}-${v.at}`}>
                      <td style={{ textAlign: "left", whiteSpace: "nowrap" }}>{dateTime(v.at)}</td>
                      <td>
                        {FACES[v.score]} {v.score}/5
                      </td>
                      <td style={{ textAlign: "left" }}>{v.moment && v.moment in SURVEY_MOMENTS ? SURVEY_MOMENTS[v.moment as SurveyMoment].label : "—"}</td>
                      <td style={{ textAlign: "left", maxWidth: 480 }}>{v.comment}</td>
                      <td>
                        <Link href={`/admin/users/${v.userId}`}>Voir</Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section
        title="Résiliations : ce qu'ils disent"
        subtitle={`Demandes de résiliation des 60 derniers jours (${int(reasons.total)}), avec le motif et le commentaire laissés dans le portail Stripe. Les réponses au questionnaire de départ sont dans « Motifs d'annulation ».`}
        actions={<Link href="/admin/annulations">Motifs d&apos;annulation →</Link>}
      >
        {!snap ? (
          <Card>
            <p style={{ margin: 0 }}>Lecture Stripe impossible pour l&apos;instant ({error}).</p>
          </Card>
        ) : (
          <>
            <Card>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {reasons.byReason.map((r) => (
                  <span key={r.key} className="cockpit-pill">
                    {r.label} : {int(r.n)}
                  </span>
                ))}
              </div>
            </Card>
            {reasons.comments.length > 0 && (
              <div className="cockpit-card" style={{ marginTop: 12, overflowX: "auto" }}>
                <table className="cockpit-table" style={{ width: "100%", fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>Date</th>
                      <th>Après</th>
                      <th style={{ textAlign: "left" }}>Commentaire</th>
                      <th>Fiche</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reasons.comments.map((c) => (
                      <tr key={`${c.userId}-${c.at}`}>
                        <td style={{ textAlign: "left", whiteSpace: "nowrap" }}>{dateTime(c.at)}</td>
                        <td>{c.daysAfterStart === 0 ? "le 1er jour" : `${c.daysAfterStart} j`}</td>
                        <td style={{ textAlign: "left", maxWidth: 520 }}>{c.comment}</td>
                        <td>{c.userId ? <Link href={`/admin/users/${c.userId}`}>Voir</Link> : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Section>

      <Section title="Offres signalées « plus disponibles »" subtitle="30 derniers jours, par site de candidature. Beaucoup de signalements sur un même site : regarder sa synchronisation.">
        <Card>
          {reports30.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13.5 }}>Aucun signalement pour l&apos;instant.</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[...bySource.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([host, n]) => (
                  <span key={host} className="cockpit-pill">
                    {host} : {int(n)}
                  </span>
                ))}
            </div>
          )}
        </Card>
        {reports30.length > 0 && (
          <div className="cockpit-card" style={{ marginTop: 12, overflowX: "auto" }}>
            <table className="cockpit-table" style={{ width: "100%", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Date</th>
                  <th style={{ textAlign: "left" }}>Offre</th>
                  <th>Vérification</th>
                  <th>Retirée</th>
                </tr>
              </thead>
              <tbody>
                {reports30.slice(0, 50).map((r) => (
                  <tr key={`${r.user_id}-${r.created_at}`}>
                    <td style={{ textAlign: "left", whiteSpace: "nowrap" }}>{dateTime(Date.parse(r.created_at))}</td>
                    <td style={{ textAlign: "left" }}>
                      <Link href={`/candidature/${String(r.metadata?.offerId ?? "")}`}>{String(r.metadata?.host ?? r.metadata?.source ?? "offre")}</Link>
                    </td>
                    <td>{{ dead: "morte", suspect: "douteuse", alive: "en ligne", unknown: "inconnue" }[String(r.metadata?.verdict)] ?? "—"}</td>
                    <td>{r.metadata?.removed === true ? "oui" : "non"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
