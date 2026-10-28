import { createAdminClient } from "@/lib/supabase/admin";
import {
  BATCH_SIZE,
  CAMPAIGNS,
  EXCLUSION_LABELS,
  MAX_SENT_PER_24H,
  NEWS_VARIANTS,
  NEWS_VARIANT_LABELS,
  audienceTime,
  campaignFrom,
  isNewsVariant,
  loadAudience,
  loadCatalog,
  renderForCampaign,
  type ExclusionReason,
} from "@/lib/campaigns/relanceOffres";
import { MIN_SENT_PER_VARIANT, WINNER_SHARE, loadVariantReport } from "@/lib/campaigns/newsTest";
import { SERIES_STEPS, loadSeriesReport, seriesDailyCap } from "@/lib/campaigns/serieVente";
import { sendCampaignBatchAction, sendCampaignTestAction } from "./actions";
import { requireAdminPage } from "@/lib/admin/accessCode";

// L'envoi d'un lot lit le catalogue, les profils et envoie 2 requêtes à
// Resend : 30 s (délai par défaut du site) peut ne pas suffire.
export const maxDuration = 60;

const muted = { color: "color-mix(in srgb, var(--color-text) 65%, transparent)" };

export default async function AdminRelancePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string; apercu?: string; c?: string; v?: string }>;
}) {
  await requireAdminPage();
  const { ok, erreur, apercu, c, v } = await searchParams;
  const campaign = campaignFrom(c);
  const isNews = campaign.id === "nouveautes";
  const variant = isNewsVariant(v) ? v : "a";
  const db = createAdminClient();
  const [audience, report, series] = await Promise.all([
    loadAudience(db, campaign, audienceTime(campaign)),
    isNews ? loadVariantReport(db) : null,
    loadSeriesReport(db),
  ]);
  const seriesCap = seriesDailyCap();
  const senderReady = Boolean(process.env.RESEND_FROM_EMAIL && process.env.RESEND_API_KEY);
  const room = Math.max(0, MAX_SENT_PER_24H - audience.sentLast24h);

  // Aperçu seulement à la demande : il relit tout le catalogue d'offres.
  let preview: { subject: string; html: string; email: string } | null = null;
  if (apercu && audience.eligible[0]) {
    const catalog = await loadCatalog(db);
    const sample = audience.eligible[Math.min(Number(apercu) || 0, audience.eligible.length - 1)];
    const rendered = renderForCampaign(campaign, sample, catalog, variant);
    preview = { subject: rendered.subject, html: rendered.html, email: sample.email ?? "" };
  }

  const excludedRows = (Object.entries(audience.excluded) as [ExclusionReason, number][]).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {Object.values(CAMPAIGNS).map((camp) => (
          <a
            key={camp.id}
            href={`/admin/relance?c=${camp.id}`}
            className={camp.id === campaign.id ? "btn btn-primary" : "btn btn-secondary"}
            style={{ fontSize: 13 }}
          >
            {camp.title}
          </a>
        ))}
      </div>

      <div className="card elev-sm flex flex-col gap-3" style={{ padding: "var(--space-5)" }}>
        <p style={{ fontSize: 15, margin: 0, fontWeight: 600 }}>Série Premium (depuis le 24/10, automatique)</p>
        <p style={{ fontSize: 13, margin: 0, ...muted }}>
          {SERIES_STEPS} emails au plus par compte, un tous les 2-3 jours, de 7 h 30 à 20 h 30 ; 500 par heure,
          {seriesCap} par jour au plus. {series.recipients} comptes dans la série · {series.payers} ont payé après leur 1er email
          {series.payersCents > 0 ? ` (${(series.payersCents / 100).toLocaleString("fr-FR")} €)` : ""}.
        </p>
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", ...muted }}>
              <th style={{ padding: "4px 8px 4px 0" }}>Email</th>
              <th style={{ padding: "4px 8px" }}>Envoyés</th>
              <th style={{ padding: "4px 8px" }}>Arrivées via l&apos;email</th>
            </tr>
          </thead>
          <tbody>
            {series.steps.map((row) => (
              <tr key={row.step} style={{ borderTop: "1px solid var(--color-divider)" }}>
                <td style={{ padding: "6px 8px 6px 0" }}>Email {row.step}</td>
                <td style={{ padding: "6px 8px" }}>{row.sent}</td>
                <td style={{ padding: "6px 8px" }}>
                  {row.clickers}
                  {row.sent > 0 && <span style={muted}> ({Math.round((row.clickers / row.sent) * 1000) / 10} %)</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h1 style={{ fontSize: 26, margin: "0 0 6px" }}>{campaign.title}</h1>
        <p style={{ fontSize: 13, margin: "0 0 6px", ...muted }}>{campaign.description}</p>
        <p style={{ fontSize: 13, margin: 0, ...muted }}>
          Un seul email par compte, jamais renvoyé. Envoi par lots de {BATCH_SIZE}, {MAX_SENT_PER_24H} maximum par 24 h
          (les deux campagnes ensemble). Les chiffres de chaque email sont calculés sur son profil (type, secteurs, ville).
        </p>
      </div>

      {ok && (
        <p className="card" style={{ padding: "var(--space-4)", margin: 0, borderColor: "var(--color-accent-600)" }}>
          ✅ {ok}
        </p>
      )}
      {erreur && (
        <p className="card" style={{ padding: "var(--space-4)", margin: 0, borderColor: "#c0392b" }}>
          ⚠️ {erreur}
        </p>
      )}
      {!senderReady && (
        <p className="card" style={{ padding: "var(--space-4)", margin: 0, borderColor: "#c0392b" }}>
          ⚠️ RESEND_FROM_EMAIL ou RESEND_API_KEY manquant dans Vercel : l&apos;envoi est bloqué.
        </p>
      )}

      {report && (
        <div className="card elev-sm flex flex-col gap-3" style={{ padding: "var(--space-5)" }}>
          <p style={{ fontSize: 15, margin: 0, fontWeight: 600 }}>Test des 4 versions (26/10 → 1/11)</p>
          <p style={{ fontSize: 13, margin: 0, ...muted }}>
            Parts égales au début. Après un jour, et dès que chaque version a {MIN_SENT_PER_VARIANT} envois, la meilleure
            (arrivées par un lien de l&apos;email / envois) prend {Math.round(WINNER_SHARE * 100)} % des envois.
            {report.leader
              ? ` En tête : ${NEWS_VARIANT_LABELS[report.leader]}.`
              : " Pas encore assez de recul pour choisir."}
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", ...muted }}>
                  <th style={{ padding: "4px 8px 4px 0" }}>Version</th>
                  <th style={{ padding: "4px 8px" }}>Envois</th>
                  <th style={{ padding: "4px 8px" }}>Arrivées via l&apos;email</th>
                  <th style={{ padding: "4px 8px" }}>Revenus connectés</th>
                  <th style={{ padding: "4px 8px" }}>Ont payé</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row) => (
                  <tr key={row.variant} style={{ borderTop: "1px solid var(--color-divider)", fontWeight: row.variant === report.leader ? 700 : 400 }}>
                    <td style={{ padding: "6px 8px 6px 0" }}>
                      <a href={`/admin/relance?c=nouveautes&apercu=0&v=${row.variant}`}>{NEWS_VARIANT_LABELS[row.variant]}</a>
                    </td>
                    <td style={{ padding: "6px 8px" }}>{row.sent}</td>
                    <td style={{ padding: "6px 8px" }}>
                      {row.clickers} {row.sent > 0 && <span style={muted}>({Math.round(row.rate * 1000) / 10} %)</span>}
                    </td>
                    <td style={{ padding: "6px 8px" }}>{row.cameBack}</td>
                    <td style={{ padding: "6px 8px" }}>
                      {row.payers}
                      {row.payersCents > 0 && <span style={muted}> ({(row.payersCents / 100).toLocaleString("fr-FR")} €)</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card elev-sm" style={{ padding: "var(--space-5)" }}>
        <p style={{ fontSize: 32, fontFamily: "var(--font-heading)", margin: 0 }}>{audience.eligible.length}</p>
        <p style={{ fontSize: 14, margin: "2px 0 12px" }}>comptes à relancer (sur {audience.totalAccounts})</p>
        <p style={{ fontSize: 13, margin: 0, ...muted }}>
          Déjà envoyés : {audience.sentTotal} · dans les dernières 24 h : {audience.sentLast24h} / {MAX_SENT_PER_24H}
        </p>
        {excludedRows.length > 0 && (
          <ul style={{ fontSize: 13, margin: "12px 0 0", paddingLeft: 18, ...muted }}>
            {excludedRows.map(([reason, count]) => (
              <li key={reason}>
                {EXCLUSION_LABELS[reason]} : {count}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card elev-sm flex flex-col gap-3" style={{ padding: "var(--space-5)" }}>
        <p style={{ fontSize: 15, margin: 0, fontWeight: 600 }}>1. Regarder l&apos;email</p>
        {isNews && (
          <div className="flex flex-wrap gap-2">
            {NEWS_VARIANTS.map((each) => (
              <a
                key={each}
                className={each === variant ? "btn btn-primary" : "btn btn-secondary"}
                style={{ fontSize: 13 }}
                href={`/admin/relance?c=${campaign.id}&apercu=${apercu ?? 0}&v=${each}`}
              >
                Version {each.toUpperCase()}
              </a>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <a className="btn btn-secondary" href={`/admin/relance?c=${campaign.id}&apercu=0&v=${variant}`}>
            Aperçu (inscrit le plus récent)
          </a>
          <a
            className="btn btn-secondary"
            href={`/admin/relance?c=${campaign.id}&apercu=${Math.floor(audience.eligible.length / 2)}&v=${variant}`}
          >
            Aperçu (un autre profil)
          </a>
        </div>
        {preview && (
          <div className="flex flex-col gap-2">
            <p style={{ fontSize: 13, margin: 0, ...muted }}>Pour {preview.email}</p>
            <p style={{ fontSize: 15, margin: 0 }}>
              <strong>Objet :</strong> {preview.subject}
            </p>
            <iframe
              title="Aperçu de l'email"
              srcDoc={preview.html}
              sandbox=""
              style={{ width: "100%", height: 520, border: "1px solid var(--color-divider)", borderRadius: 12, background: "#fff" }}
            />
          </div>
        )}
      </div>

      <form action={sendCampaignTestAction} className="card elev-sm flex flex-col gap-3" style={{ padding: "var(--space-5)" }}>
        <input type="hidden" name="c" value={campaign.id} />
        <p style={{ fontSize: 15, margin: 0, fontWeight: 600 }}>2. M&apos;envoyer un test</p>
        <div className="field">
          <label htmlFor="to">Ton adresse</label>
          <input id="to" name="to" type="email" required className="input" placeholder="toi@exemple.fr" />
        </div>
        <button type="submit" className="btn btn-secondary" disabled={!senderReady}>
          Envoyer le test
        </button>
        <p style={{ fontSize: 12, margin: 0, ...muted }}>
          Vérifie qu&apos;il arrive en boîte de réception (pas en spam) sur Gmail et, si possible, Outlook.
        </p>
      </form>

      <form action={sendCampaignBatchAction} className="card elev-sm flex flex-col gap-3" style={{ padding: "var(--space-5)" }}>
        <input type="hidden" name="c" value={campaign.id} />
        <p style={{ fontSize: 15, margin: 0, fontWeight: 600 }}>3. Envoyer le lot suivant</p>
        <p style={{ fontSize: 13, margin: 0, ...muted }}>
          {Math.min(BATCH_SIZE, room, audience.eligible.length)} emails partiront maintenant, aux inscrits les plus récents
          d&apos;abord. Attends la réponse avant de recliquer.
        </p>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!senderReady || room === 0 || audience.eligible.length === 0}
        >
          Envoyer {Math.min(BATCH_SIZE, room, audience.eligible.length)} emails
        </button>
      </form>
    </div>
  );
}
