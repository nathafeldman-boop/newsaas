// Haut du paywall (16/10, demande de Nathan) : la promesse, le nombre réel
// d'offres et la vraie note des membres. Les bénéfices détaillés sont dans
// les cartes d'offre (PricingSelector), pas ici. Que du vrai : chiffres lus
// en base, aucune garantie de résultat.

const muted = "color-mix(in srgb, var(--color-text) 62%, transparent)";

function formatCount(n: number): string {
  return n.toLocaleString("fr-FR");
}

export function PaywallPitch({
  activeOffers,
  rating,
}: {
  activeOffers: number | null;
  // Moyenne réelle des avis des étudiants qui ont payé (null : pas assez d'avis).
  rating: number | null;
}) {
  return (
    <>
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

      {activeOffers !== null && activeOffers > 0 && (
        <p
          className="animate-in tag tag-accent"
          style={{ marginTop: 12, padding: "6px 12px", fontSize: 12.5, fontWeight: 700, gap: 7 }}
        >
          <span aria-hidden className="lp-pulse" style={{ width: 8, height: 8, borderRadius: 999, background: "var(--color-accent)" }} />
          {formatCount(activeOffers)} offres t&apos;attendent en ce moment
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
    </>
  );
}
