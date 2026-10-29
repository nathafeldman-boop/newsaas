import { getDailySales, getRetentionStats, type Horizon } from "@/lib/admin/retentionStats";
import { requireAdminPage } from "@/lib/admin/accessCode";

// Rétention (SOP 27) : les cohortes d'abonnés suivies dans la durée (le
// churn du 1er mois ment), les 48 premières heures, ventes et
// renouvellements par jour sans jamais les mélanger, et les remboursements.
// Calculé depuis le relevé Stripe du cockpit (chaque abonnement et chaque paiement du compte), relu à chaque paiement.

const muted = "color-mix(in srgb, var(--color-text) 60%, transparent)";
const euros = (cents: number) => `${(cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const pct = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 100)} %` : "—");

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ marginTop: 16, padding: 16, overflowX: "auto" }}>
      <h2 style={{ fontSize: 16, margin: 0 }}>{title}</h2>
      <p style={{ fontSize: 12, margin: "4px 0 12px", color: muted, maxWidth: "80ch" }}>{subtitle}</p>
      {children}
    </div>
  );
}

const th = { padding: "4px 12px 4px 0", fontWeight: 500 } as const;
const td = { padding: "6px 12px 6px 0" } as const;

export default async function AdminRetentionPage() {
  await requireAdminPage();
  const [stats, sales] = await Promise.all([
    getRetentionStats().catch((err) => {
      console.error("AdminRetentionPage: retention stats failed", err);
      return null;
    }),
    getDailySales().catch((err) => {
      console.error("AdminRetentionPage: daily sales failed", err);
      return null;
    }),
  ]);
  const fast = stats ? (stats.first48h.started > 0 ? stats.first48h.canceled / stats.first48h.started : null) : null;

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-6">
      <h1 style={{ fontSize: 22, margin: 0 }}>Rétention</h1>
      <p style={{ fontSize: 13, margin: "6px 0 0", color: muted, maxWidth: "80ch" }}>
        Le churn du 1er mois ment : c&apos;est la cohorte suivie dans la durée qui décide de la LTV. Abonnements Stripe Stageio
        (mensuel et hebdo) ; l&apos;accès à vie ne churne pas et reste hors cohortes.
      </p>

      {stats === null ? (
        <p className="card" style={{ marginTop: 16, padding: 12, fontSize: 13 }}>
          Stripe n&apos;a pas répondu, recharge dans quelques minutes.
        </p>
      ) : (
        <>
          <Card
            title="Les 48 premières heures"
            subtitle="Abonnements des 30 derniers jours annulés dans les 48 h qui suivent le paiement. C'est là que la cohorte se joue : repère vu chez un SaaS B2C 63 %, cible 20-30 %."
          >
            <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: fast === null ? undefined : fast <= 0.3 ? "var(--color-accent-700)" : "#e5484d" }}>
              {fast === null ? "—" : `${Math.round(fast * 100)} %`}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12.5, color: muted }}>
              {stats.first48h.canceled} annulés sur {stats.first48h.started} nouveaux abonnés
            </p>
          </Card>

          <Card
            title="Cohortes par mois de souscription"
            subtitle="Les MÊMES abonnés suivis dans le temps : part encore abonnée 30, 60 et 90 jours après leur premier paiement (« — » : trop récent pour le savoir). Un trou sur un mois précis pointe un changement produit à investiguer."
          >
            {stats.cohorts.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13 }}>Aucun abonnement sur les 12 derniers mois.</p>
            ) : (
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", whiteSpace: "nowrap" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: muted }}>
                    <th style={th}>Cohorte</th>
                    <th style={th}>Abonnés</th>
                    <th style={th}>Annulés sous 48 h</th>
                    <th style={th}>Encore abonnés J+30</th>
                    <th style={th}>J+60</th>
                    <th style={th}>J+90</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.cohorts.map((c) => (
                    <tr key={c.month} style={{ borderTop: "1px solid var(--color-divider)" }}>
                      <td style={{ ...td, fontWeight: 700 }}>
                        {new Date(`${c.month}-15T12:00:00Z`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                      </td>
                      <td style={td}>{c.started}</td>
                      <td style={td}>{pct(c.canceled48h, c.started)}</td>
                      {([30, 60, 90] as Horizon[]).map((h) => (
                        <td key={h} style={{ ...td, fontWeight: 700 }}>
                          {c.alive[h].eligible > 0 ? `${pct(c.alive[h].alive, c.alive[h].eligible)} (${c.alive[h].alive}/${c.alive[h].eligible})` : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card title="Remboursements (30 jours)" subtitle="Rares si le produit tient : ordre de grandeur constaté, ~1 tous les 4 jours à fort volume.">
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
              {stats.refunds.count} remboursement{stats.refunds.count > 1 ? "s" : ""} · {euros(stats.refunds.cents)}
            </p>
          </Card>
        </>
      )}

      <Card
        title="Ventes par jour (14 jours)"
        subtitle="Nouvelles ventes et renouvellements toujours séparés : le renouvellement se lit en jours, pas en bilan mensuel. Accès à vie compté dans les nouvelles ventes."
      >
        {sales === null ? (
          <p style={{ margin: 0, fontSize: 13 }}>Calcul indisponible, recharge dans quelques minutes.</p>
        ) : sales.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13 }}>Aucun paiement sur les 14 derniers jours.</p>
        ) : (
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", whiteSpace: "nowrap" }}>
            <thead>
              <tr style={{ textAlign: "left", color: muted }}>
                <th style={th}>Jour</th>
                <th style={th}>Nouvelles ventes</th>
                <th style={th}>Montant</th>
                <th style={th}>Renouvellements</th>
                <th style={th}>Montant</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((d) => (
                <tr key={d.day} style={{ borderTop: "1px solid var(--color-divider)" }}>
                  <td style={{ ...td, fontWeight: 700 }}>
                    {new Date(`${d.day}T12:00:00Z`).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                  </td>
                  <td style={td}>{d.newSales}</td>
                  <td style={td}>{euros(d.newCents)}</td>
                  <td style={td}>{d.renewals}</td>
                  <td style={td}>{euros(d.renewalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
