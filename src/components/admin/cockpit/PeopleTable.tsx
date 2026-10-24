import Link from "next/link";
import { Avatar, Chip } from "@/components/admin/cockpit/Visual";
import { hasPaid, type Journey } from "@/lib/admin/people";
import { sourceInfo } from "@/lib/admin/trafficStats";
import { isAutoTier, isPremium } from "@/lib/subscription/isPremium";
import type { Profile } from "@/types/database";

// Tableau des comptes d'une page de détail : chaque ligne ouvre la fiche de
// la personne (parcours, swipes, candidatures, historique).

const timeFmt = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });
const dateFmt = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

const yes = (ok: boolean, text = "oui") => (ok ? <Chip tone="good">✓ {text}</Chip> : <span style={{ color: "var(--color-neutral-400)" }}>—</span>);

export function PeopleTable({ people, journeys, timeOnly = false }: { people: Profile[]; journeys: Map<string, Journey>; timeOnly?: boolean }) {
  if (people.length === 0) return <p style={{ fontSize: 13, color: "var(--color-neutral-500)", margin: 0 }}>Personne sur cette période.</p>;
  return (
    <div className="cockpit-scroll" style={{ maxHeight: 640 }}>
      <table className="cockpit-table">
        <thead>
          <tr>
            <th>{timeOnly ? "Heure" : "Inscrit le"}</th>
            <th>Personne</th>
            <th>Arrivé via</th>
            <th>Dit nous avoir connus par</th>
            <th>Onboarding</th>
            <th>Page Premium</th>
            <th>Paiement ouvert</th>
            <th>A payé</th>
          </tr>
        </thead>
        <tbody>
          {people.map((p) => {
            const j = journeys.get(p.id);
            return (
              <tr key={p.id}>
                <td>{(timeOnly ? timeFmt : dateFmt).format(Date.parse(p.created_at))}</td>
                <td>
                  <Link href={`/admin/users/${p.id}`} className="cockpit-row-link" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <Avatar name={p.full_name || p.email || "?"} seed={p.id} size={26} />
                    <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1.2 }}>
                      <span>{p.full_name || "Sans nom"}</span>
                      <span style={{ fontSize: 11.5, fontWeight: 400, color: "var(--color-neutral-600)" }}>{p.email}</span>
                    </span>
                  </Link>
                </td>
                <td>{sourceInfo(p.utm_source).label}</td>
                <td>{j?.heard ?? <span style={{ color: "var(--color-neutral-400)" }}>—</span>}</td>
                <td>{yes(!!p.onboarding_completed, "fini")}</td>
                <td>{yes((j?.paywall ?? 0) > 0, j && j.paywall > 1 ? `${j.paywall} fois` : "vue")}</td>
                <td>{yes((j?.checkout ?? 0) > 0, j && j.checkout > 1 ? `${j.checkout} fois` : "oui")}</td>
                <td>
                  {hasPaid(p) ? (
                    <Chip tone={isAutoTier(p) ? "violet" : "good"}>
                      ✓ {isAutoTier(p) ? "Auto" : p.subscription_status === "lifetime" ? "à vie" : isPremium(p) ? "Premium" : "a payé"}
                    </Chip>
                  ) : p.subscription_status === "comp" ? (
                    <Chip>offert</Chip>
                  ) : (
                    <span style={{ color: "var(--color-neutral-400)" }}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
