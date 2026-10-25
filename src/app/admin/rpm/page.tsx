import { createAdminClient } from "@/lib/supabase/admin";
import { getHourlyAttribution, getRpmWindowStats, type RpmWindowStats } from "@/lib/admin/dashboardStats";
import { saveContentViewsAction } from "@/app/admin/rpm-actions";
import { requireAdminPage } from "@/lib/admin/accessCode";

// RPM (SOP 16 « Tracking minimum vital ») : les 3 métriques de démarrage,
// vues et revenus côte à côte sur la MÊME période (les 7 jours qui finissent
// à la date de saisie), par source = lien du créateur (utm_source).
//   RPM = revenu du 1er paiement ÷ (vues ÷ 1000) -- repères : min 2 €, parfait 4 €+
//   Inscrits / 1000 vues -- le format amène-t-il du monde ?
//   Revenu / inscrit -- le funnel transforme-t-il ?

const MISSING_TABLE_SQL = `create table if not exists public.content_views (
  recorded_on date not null,
  source text not null,
  views integer not null check (views >= 0),
  created_at timestamptz not null default now(),
  primary key (recorded_on, source)
);
alter table public.content_views enable row level security;`;

const ERRORS: Record<string, string> = {
  invalid: "Saisie invalide : source, nombre de vues et date sont obligatoires.",
  save: "Enregistrement impossible, réessaie.",
  missing_table: "La table content_views n'existe pas encore : colle le SQL ci-dessous dans Supabase.",
};

const muted = "color-mix(in srgb, var(--color-text) 60%, transparent)";
const euros = (cents: number) => `${(cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

function windowEnd(recordedOn: string): string {
  return new Date(new Date(`${recordedOn}T00:00:00Z`).getTime() + 24 * 60 * 60 * 1000).toISOString();
}

function rpmColor(rpm: number): string | undefined {
  if (rpm >= 4) return "var(--color-accent-700)";
  if (rpm < 2) return "#e5484d";
  return undefined;
}

// Lectures hors du composant (horloge et requêtes : rendu pur exigé par
// React pour le corps du composant).
async function loadRpmData() {
  const admin = createAdminClient();
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
  const [{ data: rows, error: readError }, { data: recentSources }] = await Promise.all([
    admin.from("content_views").select("recorded_on, source, views").order("recorded_on", { ascending: false }).order("source").limit(60),
    admin
      .from("profiles")
      .select("utm_source")
      .not("utm_source", "is", null)
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(5000),
  ]);
  const missingTable = !!readError && (readError.code === "42P01" || readError.code === "PGRST205");
  if (readError && !missingTable) console.error("AdminRpmPage: content_views read failed", readError);

  const knownSources = [...new Set((recentSources ?? []).map((p) => p.utm_source as string))].sort();
  const dates = [...new Set((rows ?? []).map((r) => r.recorded_on))].slice(0, 6);
  const windows = new Map<string, RpmWindowStats | null>(
    await Promise.all(
      dates.map(async (d) => [d, await getRpmWindowStats(windowEnd(d)).catch(() => null)] as const),
    ),
  );
  const hourly = await getHourlyAttribution().catch((err) => {
    console.error("AdminRpmPage: hourly attribution failed", err);
    return null;
  });
  return { today, rows, missingTable, knownSources, dates, windows, hourly };
}

export default async function AdminRpmPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  await requireAdminPage();
  const { error, saved } = await searchParams;
  const { today, rows, missingTable, knownSources, dates, windows, hourly } = await loadRpmData();

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-6">
      <h1 style={{ fontSize: 22, margin: 0 }}>RPM · vues et revenus côte à côte</h1>
      <p style={{ fontSize: 13, margin: "6px 0 0", color: muted, maxWidth: "80ch" }}>
        Saisis les vues des 7 derniers jours de chaque source (le lien du créateur ou du compte, son utm_source). Revenus, inscrits
        et arrivées sont calculés sur ces mêmes 7 jours. RPM = revenu du 1er paiement ÷ (vues ÷ 1000) : minimum 2 €, parfait 4 €+.
        Une semaine complète de données avant de juger.
      </p>

      {error && (
        <p className="card" style={{ marginTop: 14, padding: 12, fontSize: 13, color: "#e5484d" }}>
          {ERRORS[error] ?? "Une erreur est survenue."}
        </p>
      )}
      {saved && (
        <p className="card" style={{ marginTop: 14, padding: 12, fontSize: 13, color: "var(--color-accent-700)" }}>
          Vues enregistrées.
        </p>
      )}

      {missingTable ? (
        <div className="card" style={{ marginTop: 16, padding: 16 }}>
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700 }}>Une étape avant de commencer</p>
          <p style={{ margin: "6px 0 10px", fontSize: 13, color: muted }}>
            Colle ce SQL dans Supabase → SQL Editor → Run, puis recharge cette page.
          </p>
          <pre style={{ margin: 0, padding: 12, fontSize: 12, borderRadius: 8, background: "var(--color-surface)", overflowX: "auto" }}>
            {MISSING_TABLE_SQL}
          </pre>
        </div>
      ) : (
        <form action={saveContentViewsAction} className="card flex flex-wrap items-end gap-3" style={{ marginTop: 16, padding: 16 }}>
          <label className="flex flex-col gap-1" style={{ fontSize: 12, fontWeight: 600 }}>
            Source (utm_source)
            <input name="source" list="rpm-sources" required placeholder="tiktok" className="input" style={{ minWidth: 180 }} />
            <datalist id="rpm-sources">
              {knownSources.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
          <label className="flex flex-col gap-1" style={{ fontSize: 12, fontWeight: 600 }}>
            Vues sur 7 jours
            <input name="views" required inputMode="numeric" placeholder="120000" className="input" style={{ width: 140 }} />
          </label>
          <label className="flex flex-col gap-1" style={{ fontSize: 12, fontWeight: 600 }}>
            Jusqu&apos;au
            <input name="recorded_on" type="date" defaultValue={today} required className="input" />
          </label>
          <button type="submit" className="btn btn-primary">
            Enregistrer
          </button>
        </form>
      )}

      {dates.length > 0 && (
        <div className="card" style={{ marginTop: 16, padding: 16, overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", whiteSpace: "nowrap" }}>
            <thead>
              <tr style={{ textAlign: "left", color: muted }}>
                {["7 jours jusqu'au", "Source", "Vues", "Inscrits", "Inscrits / 1000 vues", "Payants", "Revenu 1er paiement", "Revenu / inscrit", "RPM"].map(
                  (h) => (
                    <th key={h} style={{ padding: "4px 10px 4px 0", fontWeight: 500 }}>
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {(rows ?? [])
                .filter((r) => dates.includes(r.recorded_on))
                .map((r) => {
                  const stats = windows.get(r.recorded_on);
                  const s = stats?.[r.source] ?? { signups: 0, firstPaymentCents: 0, payers: 0 };
                  const perThousand = r.views > 0 ? r.views / 1000 : null;
                  const rpm = perThousand ? s.firstPaymentCents / 100 / perThousand : null;
                  return (
                    <tr key={`${r.recorded_on}-${r.source}`} style={{ borderTop: "1px solid var(--color-divider)" }}>
                      <td style={{ padding: "6px 10px 6px 0" }}>{new Date(`${r.recorded_on}T12:00:00Z`).toLocaleDateString("fr-FR")}</td>
                      <td style={{ padding: "6px 10px 6px 0", fontWeight: 700 }}>{r.source}</td>
                      <td style={{ padding: "6px 10px 6px 0" }}>{r.views.toLocaleString("fr-FR")}</td>
                      {stats === null ? (
                        <td colSpan={6} style={{ padding: "6px 0", color: muted }}>
                          Calcul indisponible (base lente), recharge dans quelques minutes.
                        </td>
                      ) : (
                        <>
                          <td style={{ padding: "6px 10px 6px 0" }}>{s.signups}</td>
                          <td style={{ padding: "6px 10px 6px 0" }}>{perThousand ? (s.signups / perThousand).toFixed(2) : "—"}</td>
                          <td style={{ padding: "6px 10px 6px 0" }}>{s.payers}</td>
                          <td style={{ padding: "6px 10px 6px 0" }}>{euros(s.firstPaymentCents)}</td>
                          <td style={{ padding: "6px 10px 6px 0" }}>{s.signups ? euros(s.firstPaymentCents / s.signups) : "—"}</td>
                          <td style={{ padding: "6px 0", fontWeight: 800, color: rpm !== null ? rpmColor(rpm) : undefined }}>
                            {rpm !== null ? `${rpm.toFixed(2)} €` : "—"}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      <div className="card" style={{ marginTop: 16, padding: 16, overflowX: "auto" }}>
        <h2 style={{ fontSize: 16, margin: 0 }}>Heure par heure · 72 h</h2>
        <p style={{ fontSize: 12, margin: "4px 0 12px", color: muted, maxWidth: "80ch" }}>
          Attribution par corrélation (SOP 17) : ouvre les vues TikTok heure par heure à côté. Un pic de paiements à la même heure
          qu&apos;une vidéo qui monte = le revenu vient d&apos;elle. Heures sans aucune activité masquées ; lignes avec paiement en vert.
        </p>
        {hourly === null ? (
          <p style={{ margin: 0, fontSize: 13 }}>Calcul indisponible (base lente), recharge dans quelques minutes.</p>
        ) : (
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", whiteSpace: "nowrap" }}>
            <thead>
              <tr style={{ textAlign: "left", color: muted }}>
                {["Heure", "Inscrits", "Paiements", "Montant", "Sources des inscrits"].map((h) => (
                  <th key={h} style={{ padding: "4px 12px 4px 0", fontWeight: 500 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hourly.map((h) => (
                <tr
                  key={h.hour}
                  style={{
                    borderTop: "1px solid var(--color-divider)",
                    background: h.payments > 0 ? "color-mix(in srgb, var(--color-accent) 10%, transparent)" : undefined,
                  }}
                >
                  <td style={{ padding: "5px 12px 5px 0", fontWeight: 700 }}>
                    {new Date(h.hour).toLocaleString("fr-FR", { timeZone: "Europe/Paris", weekday: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td style={{ padding: "5px 12px 5px 0" }}>{h.signups}</td>
                  <td style={{ padding: "5px 12px 5px 0", fontWeight: h.payments > 0 ? 800 : 400 }}>{h.payments}</td>
                  <td style={{ padding: "5px 12px 5px 0" }}>{h.cents > 0 ? euros(h.cents) : "—"}</td>
                  <td style={{ padding: "5px 0", color: muted }}>{h.topSources.join(" · ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ fontSize: 12, margin: "14px 0 0", color: muted, maxWidth: "80ch" }}>
        Un lien par compte de diffusion, posé dès sa création : stageio.fr/?a=nom-du-compte (même effet qu&apos;un utm_source).
        Pour le pilotage seulement, jamais pour payer un créateur (payé à la vue, ~1 €/1000).
      </p>
    </div>
  );
}
