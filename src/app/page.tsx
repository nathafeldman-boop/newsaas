import Link from "next/link";

const STEPS = [
  {
    title: "Crée ton profil",
    text: "Compétences, ville, parcours, et ton CV si tu veux (facultatif).",
  },
  {
    title: "Swipe les offres",
    text: "Aime ou passe les alternances et stages, comme sur une appli de rencontre.",
  },
  {
    title: "Postule en un geste",
    text: "Directement depuis une carte que tu aimes, sans ressaisir tes infos.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex-1">
      <header className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full">
        <span className="text-xl font-bold text-brand-dark">Alt</span>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/login" className="text-foreground/70 hover:text-foreground">
            Se connecter
          </Link>
          <Link
            href="/inscription"
            className="rounded-full bg-brand px-4 py-2 text-white hover:bg-brand-dark transition-colors"
          >
            Créer mon compte
          </Link>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-12 pb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
              Trouve ton alternance ou ton stage,{" "}
              <span className="text-brand">en swipant</span>.
            </h1>
            <p className="mt-5 text-lg text-foreground/70">
              Fini les 40 candidatures identiques sur 10 sites différents. On
              te propose les offres qui matchent ton profil, tu likes, tu
              postules — c&apos;est tout.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/inscription"
                className="rounded-full bg-brand px-6 py-3 text-white font-semibold hover:bg-brand-dark transition-colors"
              >
                Créer mon compte gratuitement
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-border px-6 py-3 font-semibold hover:bg-surface transition-colors"
              >
                J&apos;ai déjà un compte
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xs">
            <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-3xl bg-accent-pass/30" />
            <div className="relative rounded-3xl border border-border bg-surface shadow-xl p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                Alternance · Paris
              </p>
              <h3 className="mt-2 text-xl font-bold">
                Développeur Web Full-Stack
              </h3>
              <p className="mt-1 text-sm text-foreground/60">Numeria</p>
              <p className="mt-4 text-sm text-foreground/70">
                React, Node.js, équipe produit en croissance. 12-24 mois.
              </p>
              <div className="mt-6 flex items-center justify-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-accent-pass text-accent-pass text-xl">
                  ✕
                </span>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-like text-white text-2xl shadow-lg">
                  ♥
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-24 grid sm:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <div key={step.title}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand font-bold">
                {i + 1}
              </div>
              <h2 className="mt-4 font-semibold text-lg">{step.title}</h2>
              <p className="mt-1 text-sm text-foreground/70">{step.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-24 rounded-3xl bg-brand text-white px-8 py-10 text-center">
          <h2 className="text-2xl font-bold">
            Un pote te parraine ? Vous gagnez tous les deux.
          </h2>
          <p className="mt-2 text-white/80">
            Chaque compte a son lien de parrainage — dispo dans ton profil
            une fois inscrit.
          </p>
        </div>
      </main>
    </div>
  );
}
