// Argumentaire du paywall (16/10, demande de Nathan : « promesse, bénéfices,
// prix ; zéro friction, mais on garde la frustration ») : la promesse en
// gros, ce que Premium change pour l'étudiant (le résultat d'abord, la
// fonctionnalité en preuve), ce qu'il rate en restant gratuit, et les vrais
// avis quand il y en a assez. Que du vrai : chiffres lus en base, aucune
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

// Gratuit vs Premium : ce que l'essai gratuit permet vraiment (voir
// FREE_SWIPE_LIMIT dans SwipeDeck.tsx et le hard paywall du 26/09).
const COMPARISON: { label: string; free: string | boolean; premium: string | boolean }[] = [
  { label: "Parcourir les offres", free: "3 swipes", premium: "Illimité" },
  { label: "Liker et garder en favori", free: false, premium: true },
  { label: "Postuler", free: false, premium: true },
  { label: "Lettre de motivation IA", free: false, premium: true },
  { label: "Audit CV et entretien", free: false, premium: true },
];

const muted = "color-mix(in srgb, var(--color-text) 62%, transparent)";

function Mark({ value, strong }: { value: string | boolean; strong?: boolean }) {
  if (typeof value === "string") {
    return <span style={{ fontSize: 12, fontWeight: strong ? 800 : 600, color: strong ? "var(--color-accent-700)" : muted }}>{value}</span>;
  }
  return value ? (
    <span
      aria-label="Inclus"
      style={{
        width: 20,
        height: 20,
        borderRadius: 999,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #3ee08f, var(--color-accent))",
        color: "#fff",
        fontSize: 11,
        fontWeight: 900,
      }}
    >
      ✓
    </span>
  ) : (
    <span aria-label="Non inclus" style={{ fontSize: 13, color: "color-mix(in srgb, var(--color-text) 35%, transparent)" }}>
      🔒
    </span>
  );
}

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

      {/* Ce que tu rates en restant gratuit */}
      <div
        className="animate-in"
        style={{
          marginTop: 16,
          borderRadius: 16,
          border: "1px solid var(--color-divider)",
          overflow: "hidden",
          animationDelay: "0.4s",
        }}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: "1fr 76px 84px",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            padding: "9px 12px",
            background: "var(--color-surface)",
          }}
        >
          <span style={{ color: muted }}>Ce que tu débloques</span>
          <span style={{ textAlign: "center", color: muted }}>Gratuit</span>
          <span style={{ textAlign: "center", color: "var(--color-accent-700)" }}>Premium</span>
        </div>
        {COMPARISON.map((row) => (
          <div
            key={row.label}
            className="grid items-center"
            style={{
              gridTemplateColumns: "1fr 76px 84px",
              padding: "9px 12px",
              fontSize: 12.5,
              borderTop: "1px solid var(--color-divider)",
            }}
          >
            <span style={{ fontWeight: 600 }}>{row.label}</span>
            <span style={{ display: "flex", justifyContent: "center" }}>
              <Mark value={row.free} />
            </span>
            <span style={{ display: "flex", justifyContent: "center" }}>
              <Mark value={row.premium} strong />
            </span>
          </div>
        ))}
      </div>

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
