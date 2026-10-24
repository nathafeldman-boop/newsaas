import Link from "next/link";
import { createCheckoutSessionAction } from "@/app/(app)/premium/actions";
import { AUTO_DAILY_LIMIT, AUTO_PRICES } from "@/lib/pricing/plans";

// Formule « Stageio Auto » (24/10, demande de Nathan) : 17,99 €/mois ou
// 80 € à vie. Mêmes formulaires que les cartes Premium (plan en champ
// caché, voir startCheckout). Les limites sont dites telles quelles : pas
// d'envoi automatique quand le recruteur n'a laissé aucune adresse.

const muted = "color-mix(in srgb, var(--color-text) 64%, transparent)";

const POINTS = [
  `Chaque like envoie ta candidature, lettre et CV, jusqu'à ${AUTO_DAILY_LIMIT} par jour`,
  "Une adresse de candidature à ton nom et une boîte pour lire les réponses",
  "Tout Premium inclus : likes, lettres, simulateur d'entretien, suivi",
];

export function AutoPlanCard({ context }: { context: "paywall" | "upgrade_monthly" | "upgrade_lifetime" }) {
  return (
    <section
      id="auto"
      className="card elev-md"
      style={{ marginTop: 22, padding: "20px 18px", background: "var(--color-surface)", border: "1.5px solid var(--color-accent)", scrollMarginTop: 80 }}
    >
      <div className="flex items-center gap-2">
        <h2 style={{ fontSize: 19, fontWeight: 800, margin: 0 }}>Stageio Auto</h2>
        <span className="tag tag-accent" style={{ fontWeight: 700 }}>
          Nouveau
        </span>
      </div>
      <p style={{ fontSize: 13.5, lineHeight: 1.5, margin: "4px 0 0", color: muted }}>
        Tu likes, ta candidature part toute seule.
      </p>
      <ul style={{ margin: "10px 0 0", paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6, listStyle: "disc" }}>
        {POINTS.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <p style={{ fontSize: 12, lineHeight: 1.5, margin: "8px 0 0", color: muted }}>
        Envoi automatique quand le recruteur a publié une adresse ou passe par La bonne alternance (service public) ; sinon, le like
        reste un favori et tu postules toi-même. Au-delà de {AUTO_DAILY_LIMIT} par jour, les likes redeviennent des favoris jusqu&apos;au
        lendemain.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <form action={createCheckoutSessionAction}>
          <input type="hidden" name="plan" value="auto_monthly" />
          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 0, flexDirection: "column", gap: 0, padding: "10px 8px" }}>
            <span style={{ fontWeight: 800, fontSize: 16 }}>{AUTO_PRICES.monthly}</span>
            <span style={{ fontSize: 11.5 }}>par mois</span>
          </button>
        </form>
        <form action={createCheckoutSessionAction}>
          <input type="hidden" name="plan" value="auto_lifetime" />
          <button type="submit" className="btn btn-secondary btn-block" style={{ marginTop: 0, flexDirection: "column", gap: 0, padding: "10px 8px" }}>
            <span style={{ fontWeight: 800, fontSize: 16 }}>{AUTO_PRICES.lifetime}</span>
            <span style={{ fontSize: 11.5 }}>à vie, paiement unique</span>
          </button>
        </form>
      </div>

      {context === "upgrade_monthly" && (
        <p style={{ fontSize: 12, lineHeight: 1.5, margin: "10px 0 0", color: muted }}>
          Mensuel : ton abonnement Premium passe à {AUTO_PRICES.monthly}/mois dès maintenant ; la différence pour les jours restants est
          prélevée sur ta carte enregistrée. À vie : ton abonnement actuel s&apos;arrête à la fin de la période déjà payée.
        </p>
      )}
      {context === "upgrade_lifetime" && (
        <p style={{ fontSize: 12, lineHeight: 1.5, margin: "10px 0 0", color: muted }}>
          Ton accès Premium à vie reste acquis ; Stageio Auto s&apos;y ajoute.
        </p>
      )}
      <p style={{ fontSize: 11.5, margin: "10px 0 0", color: muted }}>
        Paiement sécurisé par Stripe. Mensuel sans engagement, résiliable à tout moment. <Link href="/legal/cgv">Conditions</Link>
      </p>
    </section>
  );
}
