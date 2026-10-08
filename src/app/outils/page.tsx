import Link from "next/link";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { safeJsonLd } from "@/lib/seo/jsonLd";

// Hub des outils gratuits : point d'entrée unique (et lien depuis le pied
// de page) vers le simulateur, les générateurs de lettre et de CV.
const PATH = "/outils";

const TOOLS = [
  {
    href: "/outils/simulateur-salaire-alternance",
    title: "Salaire en alternance 2026 : grille et simulateur",
    text: "Ton salaire minimum d'apprenti, en contrat pro ou ta gratification de stage, brut et net, selon ton âge et ton année.",
  },
  {
    href: "/outils/lettre-de-motivation-alternance",
    title: "Lettre de motivation pour une alternance",
    text: "Ta lettre et ton mail d'envoi en 2 minutes, avec des exemples complets.",
  },
  {
    href: "/outils/lettre-de-motivation-stage",
    title: "Lettre de motivation pour un stage",
    text: "Ta lettre et ton mail d'envoi en 2 minutes, avec des exemples complets.",
  },
  {
    href: "/outils/cv-alternance",
    title: "CV d'alternance",
    text: "Ton CV d'une page, mis en page tout seul, à télécharger en PDF.",
  },
  {
    href: "/outils/cv-stage",
    title: "CV de stage",
    text: "Ton CV d'une page, mis en page tout seul, à télécharger en PDF.",
  },
];

export const metadata: Metadata = {
  title: "Outils gratuits pour ton alternance ou ton stage : CV, lettre, salaire",
  description: "Générateur de CV en PDF, générateur de lettre de motivation et simulateur de salaire : les outils gratuits de Stageio, sans compte.",
  alternates: { canonical: `${SITE_URL}${PATH}` },
};

export default function ToolsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: TOOLS.map((tool, i) => ({ "@type": "ListItem", position: i + 1, name: tool.title, url: `${SITE_URL}${tool.href}` })),
  };
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-9">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <nav aria-label="Fil d'Ariane" style={{ fontSize: 13 }}>
        <Link href="/">Accueil</Link> › Outils
      </nav>
      <h1 style={{ fontSize: 30, margin: "12px 0 0" }}>Les outils gratuits pour ton alternance ou ton stage</h1>
      <p style={{ fontSize: 15, margin: "12px 0 24px" }}>
        Sans compte, sans pub, et rien n&apos;est enregistré : ton CV, ta lettre de motivation et ton salaire, en quelques
        minutes.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <Link key={tool.href} href={tool.href} className="card elev-sm" style={{ padding: "var(--space-5)" }}>
            <h2 className="card-title" style={{ fontSize: 17, margin: 0 }}>
              {tool.title}
            </h2>
            <p className="card-body" style={{ margin: "6px 0 0" }}>
              {tool.text}
            </p>
          </Link>
        ))}
      </div>
      <p style={{ fontSize: 15, margin: "28px 0 0" }}>
        Et pour trouver l&apos;entreprise : <Link href="/alternance">les offres d&apos;alternance</Link> et{" "}
        <Link href="/stage">les offres de stage</Link> par métier et par ville, et{" "}
        <Link href="/guides">nos guides</Link>.
      </p>
    </div>
  );
}
