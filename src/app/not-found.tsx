import Link from "next/link";
import type { Metadata } from "next";

// 404 globale (URL inconnue, page segment vide, ?page= hors limites...) :
// remplace la page anglaise par défaut de Next. Statut HTTP 404 réel --
// jamais une redirection vers l'accueil ou /login, que Google classerait
// en "soft 404".
export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-5 py-16 text-center sm:px-9">
      <p style={{ fontSize: 48, margin: 0 }}>404</p>
      <h1 style={{ fontSize: 24, margin: "8px 0 0" }}>Cette page n&apos;existe pas (ou plus)</h1>
      <p style={{ fontSize: 14, margin: "10px 0 24px" }}>
        Le lien est peut-être cassé, ou l&apos;offre a été retirée. Les offres actives, elles, sont
        toujours là.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/offres/alternance" className="btn btn-primary">
          Offres d&apos;alternance
        </Link>
        <Link href="/offres/stage" className="btn btn-secondary">
          Offres de stage
        </Link>
        <Link href="/guides" className="btn btn-secondary">
          Guides
        </Link>
      </div>
    </div>
  );
}
