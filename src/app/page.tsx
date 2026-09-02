import Link from "next/link";

const STEPS = [
  {
    title: "Crée ton profil",
    text: "Compétences, ville, parcours, et ton CV si tu veux — facultatif.",
  },
  {
    title: "Swipe les offres",
    text: "Logo, salaire, avis d'anciens alternants : tout pour décider d'un regard.",
  },
  {
    title: "Postule en un geste",
    text: "Directement depuis la carte que tu aimes, sans ressaisir tes infos.",
  },
];

const STATS = [
  { value: "1 400", label: "Offres actives", color: "var(--color-accent)" },
  { value: "48h", label: "Délai moyen" },
  { value: "62%", label: "Alternances", color: "var(--color-accent-2)" },
  { value: "4.6★", label: "Note moyenne" },
];

export default function LandingPage() {
  return (
    <div className="flex-1">
      <nav className="nav mx-auto max-w-[1200px]">
        <span className="nav-brand">Stageio</span>
        <Link href="/login" style={{ whiteSpace: "nowrap" }}>
          Se connecter
        </Link>
        <Link href="/inscription" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
          Créer mon compte
        </Link>
      </nav>

      <div className="mx-auto max-w-[1200px] px-5 sm:px-9">
        <section className="grid gap-10 py-16 md:grid-cols-[6fr_5fr] md:items-center md:py-[90px]">
          <div>
            <span className="tag tag-accent" style={{ marginBottom: 16 }}>
              Alternance &amp; stage
            </span>
            <h1
              style={{
                fontSize: "clamp(42px,6vw,72px)",
                lineHeight: 1.05,
                margin: "16px 0 0",
                maxWidth: "14ch",
              }}
            >
              Trouve ta prochaine expérience, en swipant.
            </h1>
            <p
              style={{
                fontSize: 17,
                lineHeight: "28px",
                maxWidth: "52ch",
                color: "color-mix(in srgb, var(--color-text) 78%, transparent)",
                margin: "22px 0 0",
              }}
            >
              Fini les quarante candidatures identiques sur dix sites
              différents. On te propose les offres qui matchent ton profil ;
              tu likes, tu postules, c&apos;est tout.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/inscription" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
                Créer mon compte gratuitement
              </Link>
              <Link href="/login" className="btn btn-secondary" style={{ whiteSpace: "nowrap" }}>
                J&apos;ai déjà un compte
              </Link>
            </div>
          </div>
          <figure
            className="washed m-0 overflow-hidden"
            style={{ borderRadius: "var(--radius-lg)" }}
          >
            <div
              style={{
                width: "100%",
                aspectRatio: "4/3",
                background: "var(--color-accent-200)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-accent-700)",
                fontFamily: "var(--font-heading)",
              }}
            >
              photo d&apos;équipe
            </div>
          </figure>
        </section>

        <section className="py-8">
          <div
            className="card elev-sm grid gap-6"
            style={{
              gridTemplateColumns: "repeat(4,auto)",
              justifyContent: "space-between",
              padding: "var(--space-6)",
            }}
          >
            {STATS.map((stat) => (
              <div key={stat.label}>
                <p
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: 36,
                    color: stat.color,
                    margin: 0,
                  }}
                >
                  {stat.value}
                </p>
                <p
                  style={{
                    fontSize: 12,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "color-mix(in srgb, var(--color-text) 70%, transparent)",
                    margin: "6px 0 0",
                  }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-8">
          <span className="tag tag-accent-2" style={{ marginBottom: 16 }}>
            Le parcours
          </span>
          <div className="mt-4 grid gap-7 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.title} className="card">
                <h3 className="card-title">{step.title}</h3>
                <p className="card-body">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-8">
          <div
            className="card elev-md"
            style={{ background: "var(--color-accent-2-100)", padding: "var(--space-8)" }}
          >
            <blockquote
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(22px,2.4vw,30px)",
                lineHeight: 1.35,
                maxWidth: "34ch",
                margin: 0,
                color: "var(--color-accent-2-800)",
              }}
            >
              « Trois jours après mon inscription, j&apos;avais déjà un
              entretien. »
            </blockquote>
            <figcaption style={{ fontSize: 14, color: "var(--color-accent-2-700)", marginTop: 16 }}>
              — Léa, alternante en marketing digital
            </figcaption>
          </div>
        </section>

        <section className="py-10 pb-20">
          <h2 style={{ fontSize: 28, margin: 0, maxWidth: "24ch" }}>
            Un pote te parraine ? Vous gagnez tous les deux.
          </h2>
          <p
            style={{
              fontSize: 15,
              color: "color-mix(in srgb, var(--color-text) 78%, transparent)",
              margin: "12px 0 0",
              maxWidth: "50ch",
            }}
          >
            Chaque compte a son lien de parrainage, disponible dans le profil
            une fois inscrit.
          </p>
          <div className="mt-5 flex max-w-[420px] items-stretch gap-3">
            <Link href="/inscription" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
              Créer mon compte
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
