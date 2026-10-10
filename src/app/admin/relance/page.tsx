import { createAdminClient } from "@/lib/supabase/admin";
import {
  BATCH_SIZE,
  EXCLUSION_LABELS,
  MAX_SENT_PER_24H,
  countForProfile,
  loadAudience,
  loadCatalog,
  renderCampaignEmail,
  type ExclusionReason,
} from "@/lib/campaigns/relanceOffres";
import { sendCampaignBatchAction, sendCampaignTestAction } from "./actions";

// L'envoi d'un lot lit le catalogue, les profils et envoie 2 requêtes à
// Resend : 30 s (délai par défaut du site) peut ne pas suffire.
export const maxDuration = 60;

const muted = { color: "color-mix(in srgb, var(--color-text) 65%, transparent)" };

export default async function AdminRelancePage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erreur?: string; apercu?: string }>;
}) {
  const { ok, erreur, apercu } = await searchParams;
  const db = createAdminClient();
  const audience = await loadAudience(db);
  const senderReady = Boolean(process.env.RESEND_FROM_EMAIL && process.env.RESEND_API_KEY);
  const room = Math.max(0, MAX_SENT_PER_24H - audience.sentLast24h);

  // Aperçu seulement à la demande : il relit tout le catalogue d'offres.
  let preview: { subject: string; html: string; email: string } | null = null;
  if (apercu && audience.eligible[0]) {
    const catalog = await loadCatalog(db);
    const sample = audience.eligible[Math.min(Number(apercu) || 0, audience.eligible.length - 1)];
    const rendered = renderCampaignEmail(sample, countForProfile(catalog, sample), catalog.offers.length);
    preview = { subject: rendered.subject, html: rendered.html, email: sample.email ?? "" };
  }

  const excludedRows = (Object.entries(audience.excluded) as [ExclusionReason, number][]).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 style={{ fontSize: 26, margin: "0 0 6px" }}>Relance « nouvelles offres »</h1>
        <p style={{ fontSize: 13, margin: 0, ...muted }}>
          Un seul email par compte, jamais renvoyé. Envoi par lots de {BATCH_SIZE}, {MAX_SENT_PER_24H} maximum par 24 h.
          Les chiffres de chaque email sont calculés sur son profil (type, secteurs, ville).
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
        <div className="flex flex-wrap gap-2">
          <a className="btn btn-secondary" href="/admin/relance?apercu=0">
            Aperçu (inscrit le plus récent)
          </a>
          <a className="btn btn-secondary" href={`/admin/relance?apercu=${Math.floor(audience.eligible.length / 2)}`}>
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
