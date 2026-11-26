import Link from "next/link";
import { GUARANTEE_48H, GUARANTEE_48H_APPLICATIONS } from "@/lib/premium/guaranteeTerms";
import type { PublicTestimonial } from "@/lib/reviews/publicStats";

// Blocs du paywall (26/11, Nathan : « un paywall comme TrendSaaS, en blanc et
// en vert, les mêmes garanties »). Même ordre : garantie bien visible au-dessus
// des formules, puis avantages, questions, avis. Textes propres à Stageio.

const muted = "color-mix(in srgb, var(--color-text) 62%, transparent)";

/** Bloc garantie 48 h, au-dessus des formules. La condition et « sous conditions » restent visibles. */
export function GuaranteeBlock() {
  return (
    <div
      className="animate-in flex gap-3"
      style={{
        marginTop: 16,
        padding: "14px 15px",
        borderRadius: 18,
        border: "1.5px solid var(--color-accent)",
        background: "linear-gradient(160deg, var(--color-accent-100), var(--color-surface))",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-accent)",
          color: "var(--color-bg)",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.6l7.4 3.2v5.6c0 4.7-3.1 8.7-7.4 9.9-4.3-1.2-7.4-5.2-7.4-9.9V5.8L12 2.6z" />
          <path d="M8.6 12.1l2.4 2.4 4.4-4.6" />
        </svg>
      </span>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 800, lineHeight: 1.3 }}>
          {GUARANTEE_48H.title}{" "}
          <span className="tag tag-accent" style={{ fontSize: 10.5, fontWeight: 800, padding: "2px 8px", verticalAlign: "middle" }}>
            {GUARANTEE_48H.subtitle}
          </span>
        </p>
        <p style={{ margin: "5px 0 0", fontSize: 13, lineHeight: 1.5, color: muted }}>
          {GUARANTEE_48H.hook}{" "}
          <span style={{ fontWeight: 700, color: "var(--color-text)" }}>
            {GUARANTEE_48H.mention} :{" "}
            <Link href={GUARANTEE_48H.link} target="_blank" style={{ color: "var(--color-accent-700)", textDecoration: "underline" }}>
              voir les CGV
            </Link>
          </span>
        </p>
      </div>
    </div>
  );
}

const FAQ = [
  {
    q: "Stageio utilise-t-il l'IA pour mes candidatures ?",
    a: "Non. Tes lettres partent de modèles écrits à la main et se remplissent avec ton profil et l'offre ; ton CV se fait à partir de modèles. Tu relis et tu restes maître de ce que tu envoies.",
  },
  {
    q: "Je peux arrêter quand je veux ?",
    a: "Oui. Le mensuel et le trimestriel se résilient en deux clics depuis ton profil : tu gardes l'accès jusqu'à la fin de la période payée et rien n'est plus prélevé. L'accès à vie se paie une seule fois.",
  },
  {
    q: "Comment marche la garantie 48 h ?",
    a: `Si tu envoies au moins ${GUARANTEE_48H_APPLICATIONS} candidatures avec Stageio dans les 48 h qui suivent ton paiement et que tu n'obtiens aucun entretien, tu nous écris dans les 3 jours et on te rembourse intégralement. Toutes les conditions sont dans les CGV.`,
  },
  {
    q: "Quelle formule choisir ?",
    a: "Le 3 mois revient moins cher que deux mois de mensuel : c'est le bon choix si tu cherches sur plusieurs semaines. L'accès à vie se paie une fois et ne se renouvelle jamais.",
  },
];

export function PaywallFaq() {
  return (
    <section style={{ marginTop: 26 }}>
      <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>Les questions qu&apos;on nous pose</h2>
      <div className="flex flex-col gap-2">
        {FAQ.map((f) => (
          <details key={f.q} className="card" style={{ padding: "12px 14px" }}>
            <summary style={{ cursor: "pointer", fontSize: 14, fontWeight: 700 }}>{f.q}</summary>
            <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.55, color: muted }}>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/** Vrais avis approuvés (table reviews), jamais d'avis inventé ; rien si aucun. */
export function PaywallReviews({ reviews, average, count }: { reviews: PublicTestimonial[]; average: number | null; count: number }) {
  if (reviews.length === 0) return null;
  return (
    <section style={{ marginTop: 26 }}>
      <h2 style={{ fontSize: 18, margin: 0 }}>Ce qu&apos;ils en disent</h2>
      {average !== null && count > 0 && (
        <p style={{ margin: "4px 0 10px", fontSize: 13, color: muted }}>
          ★ {String(average).replace(".", ",")}/5 sur {count.toLocaleString("fr-FR")} avis vérifiés
        </p>
      )}
      <div className="flex flex-col gap-2">
        {reviews.map((r, i) => (
          <figure key={i} className="card flex gap-3" style={{ margin: 0, padding: "12px 14px", flexDirection: "row", alignItems: "flex-start" }}>
            <span
              aria-hidden
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 16,
                background: "var(--color-accent-100)",
                color: "var(--color-accent-700)",
              }}
            >
              {r.author.trim().charAt(0).toUpperCase() || "★"}
            </span>
            <div style={{ minWidth: 0 }}>
            <div aria-label={`${r.rating} sur 5`} style={{ color: "var(--color-accent-700)", fontSize: 13, letterSpacing: 1 }}>
              {"★".repeat(r.rating)}
            </div>
            <blockquote style={{ margin: "4px 0 0", fontSize: 13.5, lineHeight: 1.5 }}>« {r.quote} »</blockquote>
            <figcaption style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: muted }}>{r.author}</figcaption>
            </div>
          </figure>
        ))}
      </div>
    </section>
  );
}
