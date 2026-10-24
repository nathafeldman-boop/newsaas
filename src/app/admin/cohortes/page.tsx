import Link from "next/link";
import { Card, Section } from "@/components/admin/cockpit/Kpi";
import { PeriodBar } from "@/components/admin/cockpit/PeriodBar";
import { euros, pct } from "@/lib/admin/cockpit/format";
import { loadSnapshot, nowMs } from "@/lib/admin/cockpit/load";
import { firstPaidBySub, paidCohorts } from "@/lib/admin/cockpit/metrics";
import { requireAdminPage } from "@/lib/admin/accessCode";

// Cohortes payantes : les clients regroupés par mois (ou semaine) de leur
// premier paiement, et ce qu'ils deviennent. Rétention payante seulement :
// un compte qui revient sans payer n'est pas un abonné retenu.
export const maxDuration = 60;

const SMALL_SAMPLE = 10;

export default async function CohortesPage({ searchParams }: { searchParams: Promise<{ grain?: string }> }) {
  await requireAdminPage();
  const { grain: rawGrain } = await searchParams;
  const grain = rawGrain === "semaine" ? "week" : "month";
  const now = nowMs();
  const { snap, error } = await loadSnapshot();
  if (!snap) {
    return (
      <Card>
        <p style={{ margin: 0 }}>Lecture Stripe impossible pour l&apos;instant ({error}).</p>
      </Card>
    );
  }
  const cohorts = paidCohorts(snap, now, grain, firstPaidBySub(snap.invoices));
  const label = (key: string) =>
    grain === "month"
      ? new Date(`${key}-15T12:00:00Z`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
      : `Sem. du ${new Date(`${key}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
  const cell = (x: { alive: number; eligible: number }) =>
    x.eligible === 0 ? <span style={{ color: "var(--color-neutral-500)" }}>pas encore</span> : `${pct(x.alive / x.eligible, 0)} (${x.alive}/${x.eligible})`;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Cohortes</h1>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--color-neutral-600)" }}>
        Clients regroupés par date de premier paiement : combien sont encore abonnés 30, 60 et 90 jours après, et comment s&apos;est passé leur premier renouvellement.
      </p>
      <PeriodBar path="/admin/cohortes" computedAt={snap.computedAt} />

      <Section title="Rétention payante">
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          <Link href="/admin/cohortes" className={`cockpit-pill${grain === "month" ? " is-good" : ""}`} style={{ textDecoration: "none" }}>
            Par mois
          </Link>
          <Link href="/admin/cohortes?grain=semaine" className={`cockpit-pill${grain === "week" ? " is-good" : ""}`} style={{ textDecoration: "none" }}>
            Par semaine
          </Link>
        </div>
        <div className="cockpit-card cockpit-scroll" style={{ padding: 0 }}>
          <table className="cockpit-table">
            <thead>
              <tr>
                <th>Cohorte</th>
                <th>Abonnés</th>
                <th>Accès à vie</th>
                <th>Encore abonnés à 30 j</th>
                <th>à 60 j</th>
                <th>à 90 j</th>
                <th>1er renouvellement</th>
                <th>Encaissé à ce jour</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map((c) => {
                const fr = c.firstRenewal;
                const done = fr.ok + fr.failed + fr.canceled;
                return (
                  <tr key={c.key}>
                    <td>
                      <strong>{label(c.key)}</strong>
                      {c.subs > 0 && c.subs < SMALL_SAMPLE && <span style={{ color: "var(--color-neutral-500)" }}> · petit échantillon</span>}
                    </td>
                    <td>{c.subs}</td>
                    <td>{c.lifetime}</td>
                    <td>{cell(c.alive[30])}</td>
                    <td>{cell(c.alive[60])}</td>
                    <td>{cell(c.alive[90])}</td>
                    <td>
                      {done < 5 ? (
                        <span style={{ color: "var(--color-neutral-500)" }}>
                          {done > 0 ? `${fr.ok} réussi(s), ${fr.failed} échec(s), ${fr.canceled} annulé(s) avant · ` : ""}
                          {fr.pending > 0 ? `${fr.pending} à venir` : done === 0 ? "—" : "trop peu pour un taux"}
                        </span>
                      ) : (
                        <>
                          {pct(fr.ok / done, 0)} réussis ({fr.ok}/{done})
                          <span style={{ color: "var(--color-neutral-500)" }}>
                            {" "}
                            · {fr.failed} échec(s), {fr.canceled} annulé(s) avant{fr.pending > 0 ? `, ${fr.pending} à venir` : ""}
                          </span>
                        </>
                      )}
                    </td>
                    <td>{euros(c.revenueCents)}</td>
                  </tr>
                );
              })}
              {cohorts.length === 0 && (
                <tr>
                  <td colSpan={8}>Aucun paiement.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 11.5, color: "var(--color-neutral-500)", marginTop: 8, maxWidth: "80ch" }}>
          « Encore abonnés à N j » ne compte que les abonnements payés depuis au moins N jours (éligibles) : une cohorte trop récente affiche « pas encore » au lieu
          d&apos;un taux trompeur. L&apos;accès à vie ne se résilie pas : il est compté à part et n&apos;entre pas dans les taux. Encaissé : factures d&apos;abonnement
          et achats à vie de la cohorte, avant remboursements. Ne comparez pas une cohorte de quelques jours à une cohorte d&apos;un mois.
        </p>
      </Section>
    </div>
  );
}
