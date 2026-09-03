import Link from "next/link";

export const metadata = {
  title: "Informations légales — Stageio",
};

const PAGES = [
  {
    href: "/legal/mentions-legales",
    title: "Mentions légales",
    text: "Éditeur du site, hébergement, propriété intellectuelle.",
  },
  {
    href: "/legal/cgu",
    title: "CGU",
    text: "Conditions générales d'utilisation du service.",
  },
  {
    href: "/legal/cgv",
    title: "CGV",
    text: "Conditions de vente de l'abonnement Premium.",
  },
  {
    href: "/legal/confidentialite",
    title: "Confidentialité",
    text: "Quelles données on traite, pourquoi, et comment les contrôler.",
  },
];

export default function LegalHubPage() {
  return (
    <div className="flex-1">
      <nav className="nav mx-auto max-w-[1200px]">
        <Link href="/" className="nav-brand" style={{ textDecoration: "none", color: "inherit" }}>
          Stageio
        </Link>
      </nav>

      <div className="mx-auto max-w-[720px] px-5 py-10 sm:px-9">
        <span className="tag tag-accent">Informations légales</span>
        <h1 style={{ fontSize: 32, margin: "16px 0 0" }}>Mentions légales &amp; CGU/CGV</h1>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {PAGES.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="card"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <h3 className="card-title">{p.title}</h3>
              <p className="card-body">{p.text}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
