import { Card, Kpi, KpiGrid, Section } from "@/components/admin/cockpit/Kpi";
import { PeriodBar } from "@/components/admin/cockpit/PeriodBar";
import { BarChart } from "@/components/admin/cockpit/BarChart";
import { SERIES_COLORS } from "@/components/admin/cockpit/chartUtils";
import { euros, int, parsePeriod, periodRanges } from "@/lib/admin/cockpit/format";
import { loadSnapshot, nowMs } from "@/lib/admin/cockpit/load";
import { UNKNOWN_CHANNEL, buildChannelReport, channelPayments, rpmCents, type ChannelRow } from "@/lib/admin/channels";
import { CHANNEL_VIEWS_SQL, loadChannelInputs, parisDay } from "@/lib/admin/channelsData";
import { saveChannelViewsAction } from "@/app/admin/canaux-actions";
import { HEARD_FROM_FORMATS, HEARD_FROM_OPTIONS, heardFromLabel } from "@/lib/onboarding/options";
import { requireAdminPage } from "@/lib/admin/accessCode";

// Revenus par canal (30/10) : ce que chaque canal (TikTok · commentaire,
// TikTok · vidéo, Instagram · vidéo…) a rapporté, jour par jour, et le RPM
// quand les vues du jour sont saisies. Attribution : channels.ts.
export const maxDuration = 60;

const ERRORS: Record<string, string> = {
  invalid: "Saisie invalide : canal, jour et nombre de vues sont obligatoires.",
  save: "Enregistrement impossible, réessaie.",
  missing_table: "La table des vues n'existe pas encore : colle le SQL ci-dessous dans Supabase.",
};

// Canaux proposés à la saisie : toutes les réponses possibles du questionnaire.
const CHANNEL_CHOICES = HEARD_FROM_OPTIONS.flatMap((o) => (o.formats ? o.formats.map((f) => heardFromLabel(o.value, f)) : [o.value]));

const rpmText = (cents: number | null) => (cents === null ? "—" : euros(cents));

function ChannelChart({ row, maxValue }: { row: ChannelRow; maxValue: number }) {
  const notes = row.days.map((d) => {
    const lines = [`Inscrits : ${int(d.signups)}`, `Nouveaux payants : ${int(d.payers)}`];
    if (d.views !== null) lines.push(`Vues : ${int(d.views)}`, `RPM : ${rpmText(rpmCents(d.firstCents, d.views))}`);
    return lines;
  });
  return (
    <BarChart
      times={row.days.map((d) => d.t)}
      series={[
        { name: "1ers paiements", color: SERIES_COLORS[0], values: row.days.map((d) => d.firstCents) },
        { name: "Renouvellements", color: SERIES_COLORS[1], values: row.days.map((d) => d.renewalCents) },
      ]}
      unit="eur"
      height={170}
      caption={`Encaissé par jour, ${row.channel}`}
      notes={notes}
      maxValue={maxValue}
    />
  );
}

export default async function CanauxPage({ searchParams }: { searchParams: Promise<{ p?: string; error?: string; saved?: string }> }) {
  await requireAdminPage();
  const { p, error, saved } = await searchParams;
  const period = parsePeriod(p);
  const now = nowMs();
  const { current } = periodRanges(period, now);
  const { snap, error: stripeError } = await loadSnapshot();
  if (!snap) {
    return (
      <Card>
        <p style={{ margin: 0 }}>Lecture Stripe impossible pour l&apos;instant ({stripeError}).</p>
      </Card>
    );
  }

  const { payments, refunds } = channelPayments(snap);
  const payerIds = [...new Set(payments.filter((x) => x.at >= current.start && x.at < current.end && x.userId).map((x) => x.userId!))].sort();
  const inputs = await loadChannelInputs(new Date(current.start).toISOString(), new Date(current.end).toISOString(), payerIds).catch((err) => {
    console.error("canaux: lecture Supabase en échec", err);
    return null;
  });
  if (!inputs) {
    return (
      <Card>
        <p style={{ margin: 0 }}>Lecture des inscrits impossible pour l&apos;instant (base lente), recharge dans quelques minutes.</p>
      </Card>
    );
  }

  const rows = buildChannelReport({
    range: current,
    payments,
    refunds,
    channelByUser: new Map(inputs.channels),
    signups: inputs.signups,
    views: inputs.views,
    dayKey: parisDay,
  });
  const total = rows.reduce((s, r) => s + r.revenueCents, 0);
  const totalFirst = rows.reduce((s, r) => s + r.firstCents, 0);
  const unknown = rows.find((r) => r.channel === UNKNOWN_CHANNEL)?.revenueCents ?? 0;
  const best = rows.find((r) => r.channel !== UNKNOWN_CHANNEL && r.revenueCents > 0) ?? null;
  const charted = rows.filter((r) => r.revenueCents > 0 || r.signups > 0 || r.views > 0);
  const today = parisDay(now);
  // Même échelle pour tous les canaux : les graphiques se comparent d'un coup d'œil.
  const chartMax = Math.max(0, ...charted.flatMap((r) => r.days.map((d) => d.firstCents + d.renewalCents)));

  return (
    <div>
      <h1 style={{ fontSize: 22, margin: 0 }}>Revenus par canal</h1>
      <p style={{ fontSize: 13, color: "var(--color-neutral-600)", margin: "6px 0 14px", maxWidth: "85ch" }}>
        Chaque paiement Stripe compte pour le canal de la personne qui paie : sa réponse à « Tu nous as connus comment ? »
        (TikTok · commentaire, TikTok · vidéo…), sinon le lien par lequel elle est arrivée (« Lien tiktok »). Le jour est celui du
        paiement, pas celui où la personne a vu la vidéo. Saisis les vues du jour d&apos;un canal pour avoir son RPM : 1ers paiements du
        jour ÷ (vues ÷ 1000).
      </p>
      <PeriodBar path="/admin/canaux" period={period} computedAt={snap.computedAt} />

      <div style={{ marginTop: 16 }}>
        <KpiGrid>
          <Kpi
            label={`Encaissé sur ${period} jours`}
            value={euros(total)}
            sub={`dont ${euros(totalFirst)} de 1ers paiements`}
            definition="Tous les paiements réussis de la période (abonnements, renouvellements, accès à vie), avant remboursements."
            source="Stripe (relevé du cockpit)"
            accent="green"
          />
          <Kpi
            label="Canal qui rapporte le plus"
            value={<span style={{ fontSize: 20, overflowWrap: "anywhere" }}>{best ? best.channel : "—"}</span>}
            sub={best ? `${euros(best.revenueCents)} · ${total ? Math.round((best.revenueCents / total) * 100) : 0} % du total` : undefined}
            definition="Canal avec le plus d'encaissements sur la période, hors « Non renseigné »."
            source="Stripe + réponses au questionnaire d'inscription"
            accent="blue"
          />
          <Kpi
            label="Non renseigné"
            value={euros(unknown)}
            sub={total ? `${Math.round((unknown / total) * 100)} % du total` : undefined}
            definition="Paiements de personnes sans réponse au questionnaire ni lien suivi (inscrites avant le 20/10 pour la plupart), ou paiements Stripe reliés à aucun compte."
            source="Stripe + Supabase"
            accent="amber"
          />
        </KpiGrid>
      </div>

      <Section title="Par canal" subtitle="Classés par encaissements. RPM calculé uniquement sur les jours où des vues sont saisies.">
        <div className="cockpit-card" style={{ overflowX: "auto" }}>
          <table className="cockpit-table" style={{ whiteSpace: "nowrap" }}>
            <thead>
              <tr>
                {["Canal", "Encaissé", "RPM", "1ers paiements", "Renouvellements", "Nouveaux payants", "Inscrits", "Revenu / inscrit", "Vues saisies", "Remboursé"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.channel}>
                  <td style={{ fontWeight: 700 }}>
                    <a href={`#canal-${encodeURIComponent(r.channel)}`}>{r.channel}</a>
                  </td>
                  <td style={{ fontWeight: 700 }}>{euros(r.revenueCents)}</td>
                  <td style={{ fontWeight: 700 }}>{rpmText(rpmCents(r.firstCentsOnViewDays, r.views))}</td>
                  <td>{euros(r.firstCents)}</td>
                  <td>{euros(r.renewalCents)}</td>
                  <td>{int(r.newPayers)}</td>
                  <td>{int(r.signups)}</td>
                  <td>{r.signups ? euros(Math.round(r.revenueCents / r.signups)) : "—"}</td>
                  <td>{r.views ? int(r.views) : "—"}</td>
                  <td>{r.refundedCents ? `−${euros(r.refundedCents)}` : "—"}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10}>Aucun paiement ni inscrit sur la période.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Vues du jour (pour le RPM)" subtitle="Les vues d'un canal ce jour-là : celles des vidéos pour « vidéo », celles des vidéos où tu as commenté pour « commentaire ». Une nouvelle saisie remplace l'ancienne.">
        {error && (
          <p className="cockpit-card" style={{ margin: "0 0 10px", fontSize: 13, color: "#b42318" }}>
            {ERRORS[error] ?? "Une erreur est survenue."}
          </p>
        )}
        {saved && (
          <p className="cockpit-card" style={{ margin: "0 0 10px", fontSize: 13, color: "#0c6b3c" }}>
            Vues enregistrées.
          </p>
        )}
        {inputs.viewsTableMissing ? (
          <div className="cockpit-card">
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700 }}>Une étape avant de saisir des vues</p>
            <p style={{ margin: "6px 0 10px", fontSize: 13, color: "var(--color-neutral-600)" }}>Colle ce SQL dans Supabase → SQL Editor → Run, puis recharge la page.</p>
            <pre style={{ margin: 0, padding: 12, fontSize: 12, borderRadius: 8, background: "var(--color-surface)", overflowX: "auto" }}>{CHANNEL_VIEWS_SQL}</pre>
          </div>
        ) : (
          <form action={saveChannelViewsAction} className="cockpit-card" style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 12 }}>
            <input type="hidden" name="p" value={period} />
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600 }}>
              Canal
              <select name="channel" required className="input" defaultValue="TikTok · commentaire" style={{ minWidth: 220 }}>
                {CHANNEL_CHOICES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600 }}>
              Jour
              <input name="day" type="date" defaultValue={today} max={today} required className="input" />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600 }}>
              Vues ce jour-là
              <input name="views" required inputMode="numeric" placeholder="25000" className="input" style={{ width: 140 }} />
            </label>
            <button type="submit" className="btn btn-primary">
              Enregistrer
            </button>
          </form>
        )}
      </Section>

      <Section title="Jour par jour" subtitle="Encaissé chaque jour par canal (1ers paiements et renouvellements). Survole une colonne : inscrits, nouveaux payants, vues et RPM du jour.">
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))" }}>
          {charted.map((r) => (
            <div key={r.channel} id={`canal-${encodeURIComponent(r.channel)}`} className="cockpit-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <h3 style={{ fontSize: 14.5, fontWeight: 700, margin: 0 }}>{r.channel}</h3>
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  {euros(r.revenueCents)}
                  <span style={{ fontWeight: 400, color: "var(--color-neutral-600)" }}>
                    {" "}
                    · {euros(Math.round(r.revenueCents / period))} / jour en moyenne
                  </span>
                </span>
              </div>
              <p style={{ fontSize: 12, color: "var(--color-neutral-600)", margin: "2px 0 8px" }}>
                {int(r.newPayers)} nouveaux payants · {int(r.signups)} inscrits
                {r.views ? ` · RPM ${rpmText(rpmCents(r.firstCentsOnViewDays, r.views))}` : ""}
              </p>
              <ChannelChart row={r} maxValue={chartMax} />
            </div>
          ))}
        </div>
        {charted.length === 0 && <p style={{ fontSize: 13 }}>Rien à afficher sur cette période.</p>}
      </Section>

      <p style={{ fontSize: 12, color: "var(--color-neutral-600)", margin: "18px 0 0", maxWidth: "85ch" }}>
        Formats demandés depuis le 25/10 : {Object.values(HEARD_FROM_FORMATS).map((f) => f.short).join(", ")}. Avant, « TikTok » sans format.
      </p>
    </div>
  );
}
