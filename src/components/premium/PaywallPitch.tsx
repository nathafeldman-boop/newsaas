// Haut du paywall (16/10, demande de Nathan) : la promesse, le nombre réel
// d'offres et la vraie note des membres. Les bénéfices détaillés sont dans
// les cartes d'offre (PricingSelector), pas ici. Que du vrai : chiffres lus
// en base, aucune garantie de résultat.

import type { ProfileOfferMatch } from "@/lib/premium/paywallProof";

const muted = "color-mix(in srgb, var(--color-text) 62%, transparent)";

function matchSentence(m: ProfileOfferMatch): string {
  const sectors = m.sectors.length > 0 ? ` en ${m.sectors.slice(0, 2).join(" ou ")}${m.sectors.length > 2 ? "…" : ""}` : "";
  return `Tu cherches ${m.contract}${sectors}${m.city ? ` à ${m.city}` : ""}`;
}

function formatCount(n: number): string {
  return n.toLocaleString("fr-FR");
}

export function PaywallPitch({
  activeOffers,
  rating,
  offerMatch = null,
  lettersWritten = null,
}: {
  // Réponses d'onboarding réinjectées + vrai nombre d'offres qui y
  // correspondent (SOP 12 : « on a remarqué [X] »).
  offerMatch?: ProfileOfferMatch | null;
  // Lettres réellement écrites par Stageio sur 30 jours (preuve chiffrée).
  lettersWritten?: number | null;
  activeOffers: number | null;
  // Moyenne réelle des avis des étudiants qui ont payé (null : pas assez d'avis).
  rating: number | null;
}) {
  return (
    <div className="pw-pitch">
      {/* Promesse */}
      <h1
        className="animate-in"
        style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", margin: "14px 0 0" }}
      >
        Décroche ton alternance{" "}
        <span
          style={{
            background: "linear-gradient(90deg, var(--color-accent), var(--color-accent-2))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          sans y passer tes soirées.
        </span>
      </h1>
      <p className="animate-in" style={{ fontSize: 14, lineHeight: 1.5, margin: "10px 0 0", color: muted }}>
        Tu likes une offre, Stageio écrit ta lettre de motivation sur mesure en quelques secondes. Tu n&apos;as plus
        qu&apos;à postuler.
      </p>

      {offerMatch ? (
        <div
          className="animate-in"
          style={{
            marginTop: 14,
            padding: "11px 14px",
            borderRadius: 14,
            background: "var(--color-accent-100)",
            border: "1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)",
          }}
        >
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--color-accent-700)" }}>🎯 On a regardé ton profil</p>
          <p style={{ margin: "3px 0 0", fontSize: 14, fontWeight: 800, lineHeight: 1.35 }}>
            {matchSentence(offerMatch)} : <span style={{ color: "var(--color-accent-700)" }}>{formatCount(offerMatch.count)} offres</span>{" "}
            correspondent, prêtes à être débloquées.
          </p>
        </div>
      ) : activeOffers !== null && activeOffers > 0 && (
        <p
          className="animate-in tag tag-accent"
          style={{ marginTop: 12, padding: "6px 12px", fontSize: 12.5, fontWeight: 700, gap: 7 }}
        >
          <span aria-hidden className="lp-pulse" style={{ width: 8, height: 8, borderRadius: 999, background: "var(--color-accent)" }} />
          {formatCount(activeOffers)} offres t&apos;attendent en ce moment
        </p>
      )}

      {lettersWritten !== null && lettersWritten >= 20 && (
        <p className="animate-in" style={{ margin: "12px 0 0", fontSize: 12.5, fontWeight: 700, textAlign: "center", color: muted }}>
          ✍️ {formatCount(lettersWritten)} lettres de motivation écrites avec Stageio ces 30 derniers jours
        </p>
      )}

      {/* Note réelle des membres qui ont payé, sans le nombre d'avis */}
      {rating !== null && (
        <p
          className="animate-in flex items-center justify-center gap-2"
          style={{ margin: "14px 0 0", fontSize: 12.5, fontWeight: 700, animationDelay: "0.45s" }}
        >
          <span aria-hidden style={{ color: "#f5b301", letterSpacing: 1 }}>
            ★★★★★
          </span>
          {rating.toLocaleString("fr-FR")}/5 · note de nos membres Premium
        </p>
      )}
    </div>
  );
}
