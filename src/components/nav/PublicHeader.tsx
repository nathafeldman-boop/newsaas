import Link from "next/link";

// En-tête des pages publiques (offres, pages métier / ville, guides, outils,
// entreprises, baromètre) : c'est là qu'arrive le trafic Google, et ces
// pages n'avaient ni logo, ni accès aux rubriques, ni bouton d'inscription
// en haut. Sans JavaScript ni lecture de session, pour que les pages
// statiques (guides) le restent. Même rendu que l'en-tête de l'accueil.
const SECTIONS = [
  { href: "/alternance", label: "Alternance" },
  { href: "/stage", label: "Stages" },
  { href: "/guides", label: "Guides" },
  { href: "/outils", label: "Outils" },
];

export function PublicHeader() {
  return (
    <header
      className="print:hidden"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "color-mix(in srgb, var(--color-bg) 82%, transparent)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--color-divider)",
      }}
    >
      <div className="flex items-center gap-4 px-4 sm:gap-5 sm:px-6" style={{ maxWidth: 1240, margin: "0 auto", paddingTop: 12, paddingBottom: 12 }}>
        <Link
          href="/"
          className="flex items-center gap-2"
          style={{ textDecoration: "none", color: "var(--color-text)", marginRight: "auto", whiteSpace: "nowrap" }}
        >
          <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-accent)" }} />
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em" }}>Stageio</span>
        </Link>
        <nav aria-label="Rubriques" className="hidden items-center gap-5 md:flex">
          {SECTIONS.map((section) => (
            <Link key={section.href} href={section.href} style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", whiteSpace: "nowrap" }}>
              {section.label}
            </Link>
          ))}
        </nav>
        <Link href="/login" style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", whiteSpace: "nowrap" }}>
          <span className="sm:hidden">Connexion</span>
          <span className="hidden sm:inline">Se connecter</span>
        </Link>
        <Link href="/inscription" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
          <span className="sm:hidden">S&apos;inscrire</span>
          <span className="hidden sm:inline">Créer mon compte gratuit</span>
        </Link>
      </div>
    </header>
  );
}
