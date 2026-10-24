import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeTotals } from "@/lib/admin/stripeTotals";

// Ventes réelles lues dans Stripe (voir lib/admin/stripeTotals.ts) : le
// calcul relit toutes les sessions de paiement et factures depuis le 1/09,
// d'où 60 s permises ; ensuite gardé 6 h, et relu par le dashboard.
export const maxDuration = 60;

const muted = { color: "color-mix(in srgb, var(--color-text) 65%, transparent)" };
const euros = (cents: number) => `${(cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

export default async function AdminStripePage() {
  const [totals, { count: totalUsers }] = await Promise.all([
    getStripeTotals(),
    createAdminClient().from("profiles").select("id", { count: "exact", head: true }),
  ]);
  const users = totalUsers ?? 0;
  const conversion = users > 0 ? `${((totals.payers / users) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %` : "—";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 style={{ fontSize: 26, margin: "0 0 6px" }}>Ventes réelles (Stripe)</h1>
        <p style={{ fontSize: 13, margin: 0, ...muted }}>
          Toutes les personnes qui ont payé au moins une fois depuis le 1er septembre, même si leur abonnement s&apos;est
          arrêté depuis. Seules les sessions de paiement liées à un compte Stageio comptent (le compte Stripe est partagé).
          Calculé le {new Date(totals.computedAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" })}, mis à jour toutes les 6 h.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ["Ont payé au moins une fois", String(totals.payers)],
          ["Inscrits → payants", `${conversion} (${totals.payers}/${users})`],
          ["Encaissé", euros(totals.revenueCents)],
          ["Remboursé", euros(totals.refundedCents)],
          ["Dont accès à vie", String(totals.lifetimePayers)],
          ["Dont abonnement", String(totals.subscriptionPayers)],
          ["Encaissé net des remboursements", euros(totals.revenueCents - totals.refundedCents)],
        ].map(([label, value]) => (
          <div key={label} className="card elev-sm" style={{ padding: "var(--space-4)" }}>
            <p style={{ fontSize: 24, fontFamily: "var(--font-heading)", margin: 0 }}>{value}</p>
            <p style={{ fontSize: 13, margin: "2px 0 0", ...muted }}>{label}</p>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, margin: 0, ...muted }}>
        Une personne qui a pris l&apos;abonnement puis l&apos;accès à vie compte une fois dans le total et dans les deux lignes « dont ».
      </p>

      <div className="card elev-sm" style={{ padding: "var(--space-5)" }}>
        <p style={{ fontSize: 15, margin: "0 0 6px", fontWeight: 600 }}>
          Payé dans Stripe mais aucun paiement noté sur le compte : {totals.missingInDb.length}
        </p>
        <p style={{ fontSize: 13, margin: 0, ...muted }}>
          Paiements que le site n&apos;a pas enregistrés (webhook manqué). Ils comptent bien ci-dessus ; pour les remettre
          sur leur compte, utilise la resynchronisation de <Link href="/admin/premium">/admin/premium</Link>.
        </p>
        {totals.missingInDb.length > 0 && (
          <ul style={{ fontSize: 13, margin: "10px 0 0", paddingLeft: 18 }}>
            {totals.missingInDb.map((m) => (
              <li key={m.userId}>
                <Link href={`/admin/users/${m.userId}`}>{m.email ?? m.userId}</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
