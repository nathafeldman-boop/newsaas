// Argumentaire du paywall (16/10, demande de Nathan : « promesse, bénéfices,
// prix ; zéro friction, mais on garde la frustration ») : la promesse en
// gros, ce que Premium change pour l'étudiant (le résultat d'abord, la
// fonctionnalité en preuve), et les vrais avis quand il y en a assez. Que du vrai : chiffres lus en base, aucune
// garantie de résultat.

const BENEFITS: { icon: string; title: string; text: string }[] = [
  {
    icon: "✍️",
    title: "Ta lettre de motivation en quelques secondes",
    text: "Écrite sur mesure pour chaque offre, à partir de ton profil et de ton CV.",
  },
  {
    icon: "❤️",
    title: "Like, favoris et candidatures illimités",
    text: "Garde chaque offre qui te plaît et postule quand tu veux.",
  },
  {
    icon: "📊",
    title: "Ton CV noté sur 100",
    text: "Avec les corrections précises pour qu'il sorte du lot.",
  },
  {
    icon: "🎤",
    title: "Prêt le jour de l'entretien",
    text: "Simulateur d'entretien à 3 niveaux, avant le vrai rendez-vous.",
  },
  {
    icon: "📈",
    title: "Toutes tes candidatures suivies",
    text: "Un tableau de bord pour ne laisser filer aucune relance.",
  },
];

const muted = "color-mix(in srgb, var(--color-text) 62%, transparent)";

function formatCount(n: number): string {
  return n.toLocaleString("fr-FR");
}

export function PaywallPitch({
  activeOffers,
  reviews,
}: {
  activeOffers: number | null;
  reviews: { count: number; average: number | null } | null;
}) {
  return (
    <>
      {/* Promesse */}
      <h1
        className="animate-in"
        style={{ fontSize: 27, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", margin: "14px 0 0" }}
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

      {/* Bénéfices */}
      <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {BENEFITS.map((b, i) => (
          <li
            key={b.title}
            className="animate-in flex items-start gap-3"
            style={{
              animationDelay: `${0.06 * (i + 1)}s`,
              padding: "12px 13px",
              borderRadius: 16,
              border: "1px solid var(--color-divider)",
              background: "var(--color-surface)",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 34,
                height: 34,
                borderRadius: 11,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 17,
                background: "var(--color-accent-100)",
              }}
            >
              {b.icon}
            </span>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, lineHeight: 1.3 }}>{b.title}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12.5, lineHeight: 1.4, color: muted }}>{b.text}</p>
            </div>
          </li>
        ))}
      </ul>

      {/* Vrais avis, seulement s'il y en a assez pour vouloir dire quelque chose */}
      {reviews && reviews.average !== null && reviews.count >= 3 && (
        <p
          className="animate-in flex items-center justify-center gap-2"
          style={{ margin: "14px 0 0", fontSize: 12.5, fontWeight: 700, animationDelay: "0.45s" }}
        >
          <span aria-hidden style={{ color: "#f5b301", letterSpacing: 1 }}>
            ★★★★★
          </span>
          {reviews.average.toLocaleString("fr-FR")}/5 · {reviews.count} avis d&apos;étudiants
        </p>
      )}
    </>
  );
}
